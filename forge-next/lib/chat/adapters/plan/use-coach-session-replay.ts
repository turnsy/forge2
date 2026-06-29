"use client";

import { useEffect, useState } from "react";
import type { HandleMessageStreamEvent } from "eve/client";
import { replayEveSessionEvents } from "@/lib/chat/adapters/plan/replay-eve-session";
import {
  withForgeSessionId,
  type CoachWorkspaceSnapshot,
} from "@/lib/chat/session-types";

export type CoachSessionReplayState =
  | { status: "loading" }
  | { status: "ready"; events: HandleMessageStreamEvent[] }
  | { status: "error"; message: string };

function getReplayKey(initialSession?: {
  id: string;
  snapshot: CoachWorkspaceSnapshot;
}): string | null {
  if (!initialSession) {
    return null;
  }

  const snapshot = withForgeSessionId(
    initialSession.id,
    initialSession.snapshot,
  );
  const eve = snapshot.eve;

  if (!eve?.sessionId) {
    return null;
  }

  return `${initialSession.id}:${eve.sessionId}:${eve.streamIndex ?? 0}`;
}

export function useCoachSessionReplay(initialSession?: {
  id: string;
  snapshot: CoachWorkspaceSnapshot;
}): CoachSessionReplayState {
  const replayKey = getReplayKey(initialSession);

  const [state, setState] = useState<CoachSessionReplayState>(() => {
    if (!replayKey) {
      return { status: "ready", events: [] };
    }

    return { status: "loading" };
  });

  useEffect(() => {
    if (!initialSession || !replayKey) {
      setState({ status: "ready", events: [] });
      return;
    }

    const snapshot = withForgeSessionId(
      initialSession.id,
      initialSession.snapshot,
    );
    const eve = snapshot.eve;

    if (!eve?.sessionId) {
      setState({ status: "ready", events: [] });
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;
    setState({ status: "loading" });

    void replayEveSessionEvents(eve, initialSession.id, {
      signal: abortController.signal,
    })
      .then((events) => {
        if (!cancelled) {
          setState({ status: "ready", events });
        }
      })
      .catch((error: unknown) => {
        if (cancelled || abortController.signal.aborted) {
          return;
        }

        console.error("Failed to restore Eve session replay", error);
        setState({
          status: "error",
          message: "Couldn't load conversation.",
        });
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [initialSession, replayKey]);

  return state;
}
