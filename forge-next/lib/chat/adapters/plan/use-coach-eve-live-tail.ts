"use client";

import { Client } from "eve/client";
import type { HandleMessageStreamEvent } from "eve/client";
import { useEffect, useRef, useState } from "react";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";
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
  | { status: "complete"; events: HandleMessageStreamEvent[] };

export function useCoachEveLiveTail(options: {
  forgeSessionId: string;
  eve: ForgeEvePointer | null | undefined;
  baseEvents: readonly HandleMessageStreamEvent[];
  enabled: boolean;
  onEventsUpdate?: (events: readonly HandleMessageStreamEvent[]) => void;
  onComplete?: (events: readonly HandleMessageStreamEvent[]) => void;
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

  useEffect(() => {
    if (!enabled || !eve?.sessionId || isTurnComplete(baseEvents)) {
      setState({ status: "idle" });
      return;
    }

    const abortController = new AbortController();
    const reducer = createEveCoachReducer();
    let events = [...baseEvents];
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

    const session = client.session(toEveSessionState(eve, baseEvents.length));

    void (async () => {
      try {
        for await (const event of session.stream({
          startIndex: baseEvents.length,
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

      setState({ status: "complete", events });
      callbacksRef.current.onComplete?.(events);
    })();

    return () => {
      abortController.abort();
    };
  }, [
    baseEvents,
    enabled,
    eve?.continuationToken,
    eve?.sessionId,
    eve?.streamIndex,
    forgeSessionId,
  ]);

  return state;
}
