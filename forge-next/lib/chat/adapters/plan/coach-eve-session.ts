"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HandleMessageStreamEvent } from "eve/client";
import {
  isTurnComplete,
  restoreEveSessionEvents,
  tailEveSessionEvents,
} from "@/lib/chat/adapters/plan/replay-eve-session";
import type { TurnFinalizeReason } from "@/lib/chat/adapters/plan/turn-lifecycle";
import type { CoachTurnMarker } from "@/lib/chat/session-types";
import {
  getPersistedEveEvents,
  hasPersistedEveEvents,
  withForgeSessionId,
  type CoachWorkspaceSnapshot,
} from "@/lib/chat/session-types";

/**
 * How caught-up the workspace is with Eve on load.
 * - "idle": fresh workspace, no session to restore.
 * - "loading": reconciling the persisted cache against the Eve server log.
 * - "resuming": a live turn is being tailed; events stream in as they arrive.
 * - "ready": the log is settled; the interactive workspace can own the session.
 * - "error": nothing could be restored.
 */
export type CoachEveLoadPhase =
  | "idle"
  | "loading"
  | "resuming"
  | "ready"
  | "error";

export type CoachEveCatchUpState = {
  loadPhase: CoachEveLoadPhase;
  events: readonly HandleMessageStreamEvent[];
  /** Set when the last turn was finalized locally instead of by a server boundary event. */
  finalizeReason: TurnFinalizeReason | null;
  errorMessage?: string;
  /** Aborts a live tail and settles the session as user-stopped. */
  stopResuming: () => void;
};

type CatchUpRequest =
  | { kind: "none"; events: HandleMessageStreamEvent[] }
  | {
      kind: "fetch";
      forgeSessionId: string;
      eve: NonNullable<CoachWorkspaceSnapshot["eve"]>;
      cachedEvents: readonly HandleMessageStreamEvent[];
      lastTurn: CoachTurnMarker | null;
    };

type CatchUpProgress =
  | { stage: "loading" }
  | { stage: "resuming"; events: readonly HandleMessageStreamEvent[] }
  | {
      stage: "ready";
      events: readonly HandleMessageStreamEvent[];
      finalizeReason: TurnFinalizeReason | null;
    }
  | { stage: "error"; errorMessage: string };

function getCatchUpKey(initialSession?: {
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

  if (!snapshot.eve?.sessionId) {
    return hasPersistedEveEvents(snapshot)
      ? `${initialSession.id}:persisted-only`
      : null;
  }

  return `${initialSession.id}:${snapshot.eve.sessionId}:${getPersistedEveEvents(snapshot).length}`;
}

function resolveCatchUpRequest(initialSession?: {
  id: string;
  snapshot: CoachWorkspaceSnapshot;
}): CatchUpRequest {
  if (!initialSession) {
    return { kind: "none", events: [] };
  }

  const snapshot = withForgeSessionId(
    initialSession.id,
    initialSession.snapshot,
  );

  if (!snapshot.eve?.sessionId) {
    return {
      kind: "none",
      events: [...getPersistedEveEvents(snapshot)],
    };
  }

  return {
    kind: "fetch",
    forgeSessionId: initialSession.id,
    eve: snapshot.eve,
    cachedEvents: hasPersistedEveEvents(snapshot)
      ? getPersistedEveEvents(snapshot)
      : [],
    lastTurn: snapshot.lastTurn ?? null,
  };
}

function settledFinalizeReason(
  events: readonly HandleMessageStreamEvent[],
): TurnFinalizeReason | null {
  return events.length > 0 && !isTurnComplete(events) ? "restored" : null;
}

export function isCoachEveAgentReady(loadPhase: CoachEveLoadPhase): boolean {
  return (
    loadPhase === "idle" || loadPhase === "ready" || loadPhase === "resuming"
  );
}

export function isCoachEveSessionLoading(loadPhase: CoachEveLoadPhase): boolean {
  return loadPhase === "loading";
}

/**
 * Restores a coach session with Eve as the source of truth: hydrates the
 * persisted cache, reconciles it against the server log, tails a live turn
 * when one may be running, and locally finalizes turns that will never
 * complete. The interactive workspace mounts only on a settled log.
 */
export function useCoachEveCatchUp(initialSession?: {
  id: string;
  snapshot: CoachWorkspaceSnapshot;
}): CoachEveCatchUpState {
  const catchUpKey = getCatchUpKey(initialSession);
  const request = useMemo(
    () => resolveCatchUpRequest(initialSession),
    [initialSession],
  );

  const [progress, setProgress] = useState<{
    key: string;
    value: CatchUpProgress;
  } | null>(null);
  const stopTailRef = useRef<(() => void) | null>(null);
  const shouldFetch = request.kind === "fetch" && Boolean(catchUpKey);

  const stopResuming = useCallback(() => {
    stopTailRef.current?.();
  }, []);

  useEffect(() => {
    if (!shouldFetch || !catchUpKey || request.kind !== "fetch") {
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;
    const activeKey = catchUpKey;

    const update = (value: CatchUpProgress) => {
      if (!cancelled) {
        setProgress({ key: activeKey, value });
      }
    };

    const run = async () => {
      const restored = await restoreEveSessionEvents(
        request.eve,
        request.forgeSessionId,
        {
          signal: abortController.signal,
          fromEvents:
            request.cachedEvents.length > 0 ? request.cachedEvents : undefined,
          lastTurn: request.lastTurn,
        },
      );

      if (cancelled || abortController.signal.aborted) {
        return;
      }

      if (!restored.needsLiveTail) {
        update({
          stage: "ready",
          events: restored.events,
          finalizeReason: restored.markerApplies ? "restored" : null,
        });
        return;
      }

      let events: HandleMessageStreamEvent[] = [...restored.events];
      update({ stage: "resuming", events });

      const tailAbort = new AbortController();
      const onParentAbort = () => tailAbort.abort();
      abortController.signal.addEventListener("abort", onParentAbort);

      let stoppedByUser = false;
      stopTailRef.current = () => {
        stoppedByUser = true;
        tailAbort.abort();
      };

      try {
        const tail = await tailEveSessionEvents(
          request.eve,
          request.forgeSessionId,
          {
            startIndex: events.length,
            signal: tailAbort.signal,
            onEvent: (event) => {
              events = [...events, event];
              update({ stage: "resuming", events });
            },
          },
        );

        if (cancelled || abortController.signal.aborted) {
          return;
        }

        update({
          stage: "ready",
          events,
          finalizeReason: tail.completed
            ? null
            : stoppedByUser
              ? "stopped"
              : "interrupted",
        });
      } finally {
        abortController.signal.removeEventListener("abort", onParentAbort);
        stopTailRef.current = null;
      }
    };

    void run().catch((error: unknown) => {
      if (cancelled || abortController.signal.aborted) {
        return;
      }

      console.error("Failed to restore Eve session", error);

      if (request.cachedEvents.length > 0) {
        update({
          stage: "ready",
          events: [...request.cachedEvents],
          finalizeReason: settledFinalizeReason(request.cachedEvents),
        });
        return;
      }

      update({ stage: "error", errorMessage: "Couldn't load conversation." });
    });

    return () => {
      cancelled = true;
      abortController.abort();
      stopTailRef.current = null;
    };
  }, [catchUpKey, request, shouldFetch]);

  if (request.kind === "none") {
    return {
      loadPhase: request.events.length > 0 ? "ready" : "idle",
      events: [...request.events],
      finalizeReason: settledFinalizeReason(request.events),
      stopResuming,
    };
  }

  const current: CatchUpProgress =
    progress?.key === catchUpKey ? progress.value : { stage: "loading" };

  switch (current.stage) {
    case "loading":
      return {
        loadPhase: "loading",
        events: [],
        finalizeReason: null,
        stopResuming,
      };
    case "resuming":
      return {
        loadPhase: "resuming",
        events: current.events,
        finalizeReason: null,
        stopResuming,
      };
    case "ready":
      return {
        loadPhase: "ready",
        events: current.events,
        finalizeReason: current.finalizeReason,
        stopResuming,
      };
    case "error":
      return {
        loadPhase: "error",
        events: [],
        finalizeReason: null,
        errorMessage: current.errorMessage,
        stopResuming,
      };
  }
}
