"use client";

import { useEffect, useMemo, useState } from "react";
import type { HandleMessageStreamEvent } from "eve/client";
import { restoreEveSessionEvents } from "@/lib/chat/adapters/plan/replay-eve-session";
import {
  getPersistedEveEvents,
  hasPersistedEveEvents,
  withForgeSessionId,
  type CoachWorkspaceSnapshot,
} from "@/lib/chat/session-types";

export type CoachSessionReplayState =
  | { status: "loading" }
  | { status: "ready"; events: HandleMessageStreamEvent[] }
  | { status: "error"; message: string };

type ResolvedReplayState =
  | CoachSessionReplayState
  | { status: "needs-fetch" };

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

  if (hasPersistedEveEvents(snapshot)) {
    return `${initialSession.id}:persisted`;
  }

  const eve = snapshot.eve;

  if (!eve?.sessionId) {
    return null;
  }

  return `${initialSession.id}:${eve.sessionId}`;
}

function resolveReplayState(
  initialSession?: {
    id: string;
    snapshot: CoachWorkspaceSnapshot;
  },
  replayKey?: string | null,
): ResolvedReplayState {
  if (!initialSession) {
    return { status: "ready", events: [] };
  }

  const snapshot = withForgeSessionId(
    initialSession.id,
    initialSession.snapshot,
  );

  if (hasPersistedEveEvents(snapshot)) {
    return {
      status: "ready",
      events: [...getPersistedEveEvents(snapshot)],
    };
  }

  if (!replayKey) {
    return { status: "ready", events: [] };
  }

  const eve = snapshot.eve;

  if (!eve?.sessionId) {
    return { status: "ready", events: [] };
  }

  return { status: "needs-fetch" };
}

export function useCoachSessionReplay(initialSession?: {
  id: string;
  snapshot: CoachWorkspaceSnapshot;
}): CoachSessionReplayState {
  const replayKey = getReplayKey(initialSession);

  const resolvedState = useMemo(
    () => resolveReplayState(initialSession, replayKey),
    [initialSession, replayKey],
  );

  const [fetchedState, setFetchedState] = useState<CoachSessionReplayState | null>(
    null,
  );
  const [fetchedReplayKey, setFetchedReplayKey] = useState<string | null>(null);

  useEffect(() => {
    if (resolvedState.status !== "needs-fetch" || !initialSession || !replayKey) {
      return;
    }

    const snapshot = withForgeSessionId(
      initialSession.id,
      initialSession.snapshot,
    );
    const eve = snapshot.eve;

    if (!eve?.sessionId) {
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;

    void restoreEveSessionEvents(eve, initialSession.id, {
      signal: abortController.signal,
    })
      .then((events) => {
        if (!cancelled) {
          setFetchedState({ status: "ready", events });
          setFetchedReplayKey(replayKey);
        }
      })
      .catch((error: unknown) => {
        if (cancelled || abortController.signal.aborted) {
          return;
        }

        console.error("Failed to restore Eve session replay", error);
        setFetchedState({
          status: "error",
          message: "Couldn't load conversation.",
        });
        setFetchedReplayKey(replayKey);
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [initialSession, replayKey, resolvedState.status]);

  if (resolvedState.status === "ready" || resolvedState.status === "error") {
    return resolvedState;
  }

  if (fetchedState && fetchedReplayKey === replayKey) {
    return fetchedState;
  }

  return { status: "loading" };
}
