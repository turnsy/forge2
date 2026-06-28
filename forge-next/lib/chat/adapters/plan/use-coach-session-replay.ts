"use client";

import { useEffect, useState } from "react";
import type { HandleMessageStreamEvent } from "eve/client";
import { replayEveSessionEvents } from "@/lib/chat/adapters/plan/replay-eve-session";
import {
  normalizeCoachWorkspaceSnapshot,
  type CoachWorkspaceSnapshot,
} from "@/lib/chat/session-types";

export type CoachSessionReplayState =
  | { status: "loading" }
  | { status: "ready"; events: HandleMessageStreamEvent[] }
  | { status: "error"; message: string };

export function useCoachSessionReplay(initialSession?: {
  id: string;
  snapshot: CoachWorkspaceSnapshot;
}): CoachSessionReplayState {
  const [state, setState] = useState<CoachSessionReplayState>(() => {
    if (!initialSession) {
      return { status: "ready", events: [] };
    }

    const normalized = normalizeCoachWorkspaceSnapshot(
      initialSession.id,
      initialSession.snapshot,
    );

    if (!normalized.eve?.sessionId) {
      return { status: "ready", events: [] };
    }

    return { status: "loading" };
  });

  useEffect(() => {
    if (!initialSession) {
      return;
    }

    const normalized = normalizeCoachWorkspaceSnapshot(
      initialSession.id,
      initialSession.snapshot,
    );
    const eve = normalized.eve;

    if (!eve?.sessionId) {
      setState({ status: "ready", events: [] });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    void replayEveSessionEvents(eve, initialSession.id)
      .then((events) => {
        if (!cancelled) {
          setState({ status: "ready", events });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Could not restore conversation.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialSession]);

  return state;
}
