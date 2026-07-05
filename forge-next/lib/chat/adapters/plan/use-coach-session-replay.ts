"use client";

import { useEffect, useMemo, useState } from "react";
import type { HandleMessageStreamEvent } from "eve/client";
import { restoreEveSessionEvents, isTurnComplete } from "@/lib/chat/adapters/plan/replay-eve-session";
import {
  getPersistedEveEvents,
  hasPersistedEveEvents,
  withForgeSessionId,
  type CoachWorkspaceSnapshot,
} from "@/lib/chat/session-types";

export type CoachSessionReplayState =
  | { status: "loading" }
  | {
      status: "ready";
      events: HandleMessageStreamEvent[];
      isSyncing: boolean;
    }
  | { status: "error"; message: string };

type ResolvedReplayState =
  | CoachSessionReplayState
  | {
      status: "needs-fetch";
      persistedEvents?: readonly HandleMessageStreamEvent[];
    };

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
    if (hasPersistedEveEvents(snapshot)) {
      return `${initialSession.id}:persisted-only`;
    }
    return null;
  }

  const persistedCount = getPersistedEveEvents(snapshot).length;
  return `${initialSession.id}:${eve.sessionId}:${persistedCount}`;
}

function resolveReplayState(
  initialSession?: {
    id: string;
    snapshot: CoachWorkspaceSnapshot;
  },
  replayKey?: string | null,
): ResolvedReplayState {
  if (!initialSession) {
    return { status: "ready", events: [], isSyncing: false };
  }

  const snapshot = withForgeSessionId(
    initialSession.id,
    initialSession.snapshot,
  );

  const eve = snapshot.eve;

  if (!eve?.sessionId) {
    if (hasPersistedEveEvents(snapshot)) {
      return {
        status: "ready",
        events: [...getPersistedEveEvents(snapshot)],
        isSyncing: false,
      };
    }

    return { status: "ready", events: [], isSyncing: false };
  }

  if (!replayKey) {
    return { status: "ready", events: [], isSyncing: false };
  }

  return {
    status: "needs-fetch",
    persistedEvents: hasPersistedEveEvents(snapshot)
      ? getPersistedEveEvents(snapshot)
      : undefined,
  };
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

  const checkpoint =
    resolvedState.status === "needs-fetch"
      ? [...(resolvedState.persistedEvents ?? [])]
      : [];

  const isInFlightCheckpoint =
    checkpoint.length > 0 && !isTurnComplete(checkpoint);

  const [fetchResult, setFetchResult] = useState<{
    replayKey: string;
    events: HandleMessageStreamEvent[];
  } | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

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

    setFetchResult(null);
    setFetchError(null);
    setIsFetching(true);

    void restoreEveSessionEvents(eve, initialSession.id, {
      signal: abortController.signal,
      fromEvents: resolvedState.persistedEvents,
    })
      .then((events) => {
        if (!cancelled) {
          setFetchResult({ replayKey, events });
        }
      })
      .catch((error: unknown) => {
        if (cancelled || abortController.signal.aborted) {
          return;
        }

        console.error("Failed to restore Eve session replay", error);
        setFetchError("Couldn't load conversation.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsFetching(false);
        }
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [initialSession, replayKey, resolvedState]);

  if (resolvedState.status === "ready" || resolvedState.status === "error") {
    return resolvedState;
  }

  if (fetchResult?.replayKey === replayKey) {
    return {
      status: "ready",
      events: fetchResult.events,
      isSyncing: false,
    };
  }

  if (fetchError) {
    if (checkpoint.length > 0) {
      return {
        status: "ready",
        events: checkpoint,
        isSyncing: false,
      };
    }

    return { status: "error", message: fetchError };
  }

  if (isInFlightCheckpoint) {
    return {
      status: "ready",
      events: checkpoint,
      isSyncing: isFetching,
    };
  }

  if (isFetching) {
    return { status: "loading" };
  }

  return { status: "loading" };
}
