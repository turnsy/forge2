"use client";

import { useEffect, useState } from "react";
import type { HandleMessageStreamEvent } from "eve/client";
import { resolveCoachSessionEvents } from "@/lib/chat/adapters/plan/resolve-session-events";
import {
  getPersistedEveEvents,
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

  if (snapshot.eve?.sessionId) {
    return `${initialSession.id}:${snapshot.eve.sessionId}:${getPersistedEveEvents(snapshot).length}`;
  }

  if (getPersistedEveEvents(snapshot).length > 0) {
    return `${initialSession.id}:persisted`;
  }

  return null;
}

function needsEveReconciliation(snapshot: CoachWorkspaceSnapshot): boolean {
  return Boolean(snapshot.eve?.sessionId);
}

export function useCoachSessionReplay(initialSession?: {
  id: string;
  snapshot: CoachWorkspaceSnapshot;
}): CoachSessionReplayState {
  const replayKey = getReplayKey(initialSession);

  const [state, setState] = useState<CoachSessionReplayState>(() => {
    if (!initialSession) {
      return { status: "ready", events: [] };
    }

    const snapshot = withForgeSessionId(
      initialSession.id,
      initialSession.snapshot,
    );

    if (needsEveReconciliation(snapshot)) {
      return { status: "loading" };
    }

    return {
      status: "ready",
      events: [...getPersistedEveEvents(snapshot)],
    };
  });

  useEffect(() => {
    if (!initialSession || !replayKey) {
      return;
    }

    const snapshot = withForgeSessionId(
      initialSession.id,
      initialSession.snapshot,
    );

    if (!needsEveReconciliation(snapshot)) {
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;

    void resolveCoachSessionEvents(snapshot, initialSession.id, {
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
  }, [initialSession?.id, replayKey]);

  return state;
}
