"use client";

import { Client } from "eve/client";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { useEffect, useRef, useState } from "react";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";
import { getEveStreamTailStartIndex } from "@/lib/chat/adapters/plan/eve-session-status";
import { isTurnComplete } from "@/lib/chat/adapters/plan/replay-eve-session";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";
import {
  toEveSessionState,
  type EveCoachReducerData,
  type ForgeEvePointer,
} from "@/lib/chat/session-types";

export type CoachEveLiveTailState =
  | { status: "idle" }
  | {
      status: "streaming";
      events: HandleMessageStreamEvent[];
      data: EveCoachReducerData;
    }
  | {
      status: "complete";
      events: HandleMessageStreamEvent[];
      session: SessionState;
    };

function getBaseEventsKey(events: readonly HandleMessageStreamEvent[]): string {
  const last = events.at(-1);
  return `${events.length}:${last?.type ?? "none"}`;
}

export function useCoachEveLiveTail(options: {
  forgeSessionId: string;
  eve: ForgeEvePointer | null | undefined;
  baseEvents: readonly HandleMessageStreamEvent[];
  enabled: boolean;
  onEventsUpdate?: (events: readonly HandleMessageStreamEvent[]) => void;
  onComplete?: (payload: {
    events: readonly HandleMessageStreamEvent[];
    session: SessionState;
  }) => void;
}): CoachEveLiveTailState {
  const {
    forgeSessionId,
    eve,
    baseEvents,
    enabled,
    onEventsUpdate,
    onComplete,
  } = options;

  const [state, setState] = useState<CoachEveLiveTailState>({ status: "idle" });
  const callbacksRef = useRef({ onEventsUpdate, onComplete });
  callbacksRef.current = { onEventsUpdate, onComplete };
  const baseEventsKey = getBaseEventsKey(baseEvents);

  useEffect(() => {
    if (!enabled || !eve?.sessionId) {
      setState({ status: "idle" });
      return;
    }

    const abortController = new AbortController();
    const reducer = createEveCoachReducer();
    const seedEvents = [...baseEvents];
    const streamStartIndex = getEveStreamTailStartIndex(eve, seedEvents);
    let events =
      streamStartIndex > seedEvents.length
        ? seedEvents
        : [...seedEvents];
    let data = events.reduce(
      (current, event) => reducer.reduce(current, event),
      reducer.initial(),
    );

    setState({ status: "streaming", events, data });

    const client = new Client({
      host: "",
      headers: {
        [FORGE_SESSION_HEADER]: forgeSessionId,
      },
      preserveCompletedSessions: true,
    });

    const eveSession = client.session(
      toEveSessionState(eve, streamStartIndex),
    );

    void (async () => {
      try {
        for await (const event of eveSession.stream({
          startIndex: streamStartIndex,
          signal: abortController.signal,
        })) {
          if (abortController.signal.aborted) {
            break;
          }

          events = [...events, event];
          data = reducer.reduce(data, event);
          setState({ status: "streaming", events, data });
          callbacksRef.current.onEventsUpdate?.(events);

          if (isTurnComplete(events)) {
            break;
          }
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Failed to tail live Eve session", error);
        }
      }

      if (abortController.signal.aborted) {
        return;
      }

      const session = eveSession.state;
      setState({ status: "complete", events, session });
      callbacksRef.current.onComplete?.({ events, session });
    })();

    return () => {
      abortController.abort();
    };
  }, [
    baseEventsKey,
    enabled,
    eve?.continuationToken,
    eve?.sessionId,
    eve?.streamIndex,
    forgeSessionId,
  ]);

  return state;
}
