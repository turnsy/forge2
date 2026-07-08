"use client";

import { useEffect, useMemo, useState } from "react";
import type { HandleMessageStreamEvent } from "eve/client";
import {
  isTurnComplete,
  restoreEveSessionEvents,
} from "@/lib/chat/adapters/plan/replay-eve-session";
import type { EveCoachReducerData } from "@/lib/chat/session-types";
import { isActiveRunStatus } from "@/lib/chat/run-status-copy";
import { STREAM_INTERRUPTED_MESSAGE } from "@/lib/chat/stream-completion";
import {
  getPersistedEveEvents,
  hasPersistedEveEvents,
  withForgeSessionId,
  type CoachWorkspaceSnapshot,
} from "@/lib/chat/session-types";

/** How caught-up the workspace is with Eve on load. */
export type CoachEveLoadPhase =
  | "idle"
  | "loading"
  | "ready"
  | "waiting"
  | "interrupted"
  | "error";

export type CoachEveCatchUpState = {
  loadPhase: CoachEveLoadPhase;
  events: HandleMessageStreamEvent[];
  errorMessage?: string;
};

type CatchUpRequest =
  | { kind: "none"; events: HandleMessageStreamEvent[] }
  | {
      kind: "fetch";
      forgeSessionId: string;
      eve: NonNullable<CoachWorkspaceSnapshot["eve"]>;
      cachedEvents: readonly HandleMessageStreamEvent[];
    };

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
  };
}

function resolveLoadPhase(
  request: CatchUpRequest,
  events: readonly HandleMessageStreamEvent[],
  fetching: boolean,
  fetchFailed: boolean,
): CoachEveLoadPhase {
  if (request.kind === "none") {
    return initialSessionLoadPhase(events);
  }

  if (fetchFailed && events.length === 0) {
    return "error";
  }

  if (fetching) {
    return "loading";
  }

  if (!isTurnComplete(events)) {
    return "waiting";
  }

  return "ready";
}

function initialSessionLoadPhase(
  events: readonly HandleMessageStreamEvent[],
): CoachEveLoadPhase {
  return events.length > 0 ? "ready" : "idle";
}

export function isAbortErrorMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  return (
    normalized === "fetch is aborted" ||
    normalized === "the operation was aborted." ||
    normalized === "the user aborted a request."
  );
}

function isAbortFailureState(data: EveCoachReducerData): boolean {
  return (
    data.phase === "error" &&
    data.runStatus === "error" &&
    data.errors.length > 0 &&
    data.errors.every((error) => isAbortErrorMessage(error.message))
  );
}

export function applyUserStoppedTurn(
  data: EveCoachReducerData,
  options?: { interrupted?: boolean },
): EveCoachReducerData {
  const hadActiveRun =
    data.runStatus !== null && isActiveRunStatus(data.runStatus);
  const hadStreamingPhase = data.phase === "streaming";
  const hadAbortFailure = !options?.interrupted && isAbortFailureState(data);

  if (!hadActiveRun && !hadStreamingPhase && !hadAbortFailure) {
    return data;
  }

  if (!hadActiveRun && !hadStreamingPhase && hadAbortFailure) {
    return {
      ...data,
      phase: "idle",
      runStatus: null,
      errors: [],
      streamingAssistantText: "",
    };
  }

  const assistantText = data.streamingAssistantText.trim();
  const next: EveCoachReducerData = assistantText
    ? {
        ...data,
        messages: [
          ...data.messages,
          { role: "assistant" as const, content: assistantText },
        ],
        streamingAssistantText: "",
        runStatus: "done",
        phase: "idle",
      }
    : {
        ...data,
        runStatus: null,
        phase: "idle",
        streamingAssistantText: "",
      };

  if (!options?.interrupted || !hadActiveRun) {
    return options?.interrupted ? next : { ...next, errors: [] };
  }

  if (
    next.errors.some((error) => error.message === STREAM_INTERRUPTED_MESSAGE)
  ) {
    return next;
  }

  return {
    ...next,
    errors: [...next.errors, { message: STREAM_INTERRUPTED_MESSAGE }],
  };
}

export function applyCoachEveLoadPhase(
  loadPhase: CoachEveLoadPhase,
  data: EveCoachReducerData,
): EveCoachReducerData {
  if (loadPhase !== "interrupted") {
    return data;
  }

  return applyUserStoppedTurn(data, { interrupted: true });
}

export function isCoachEveAgentReady(loadPhase: CoachEveLoadPhase): boolean {
  return (
    loadPhase === "idle" ||
    loadPhase === "ready" ||
    loadPhase === "waiting" ||
    loadPhase === "interrupted"
  );
}

export function isCoachEveSessionLoading(loadPhase: CoachEveLoadPhase): boolean {
  return loadPhase === "loading";
}

export function useCoachEveCatchUp(initialSession?: {
  id: string;
  snapshot: CoachWorkspaceSnapshot;
}): CoachEveCatchUpState {
  const catchUpKey = getCatchUpKey(initialSession);
  const request = useMemo(
    () => resolveCatchUpRequest(initialSession),
    [initialSession],
  );

  const [fetchState, setFetchState] = useState<{
    key: string;
    events: HandleMessageStreamEvent[];
    failed: boolean;
  } | null>(null);
  const shouldFetch = request.kind === "fetch" && Boolean(catchUpKey);

  useEffect(() => {
    if (!shouldFetch || !catchUpKey) {
      return;
    }

    const abortController = new AbortController();
    let cancelled = false;
    const activeKey = catchUpKey;

    void restoreEveSessionEvents(request.eve, request.forgeSessionId, {
      signal: abortController.signal,
      fromEvents:
        request.cachedEvents.length > 0 ? request.cachedEvents : undefined,
    })
      .then((events) => {
        if (!cancelled) {
          setFetchState({ key: activeKey, events, failed: false });
        }
      })
      .catch((error: unknown) => {
        if (cancelled || abortController.signal.aborted) {
          return;
        }

        console.error("Failed to restore Eve session", error);
        setFetchState({
          key: activeKey,
          events: [...request.cachedEvents],
          failed: true,
        });
      });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [catchUpKey, request, shouldFetch]);

  if (request.kind === "none") {
    return {
      loadPhase: initialSessionLoadPhase(request.events),
      events: [...request.events],
    };
  }

  const resolvedEvents =
    fetchState?.key === catchUpKey ? fetchState.events : [];
  const fetchFailed = fetchState?.key === catchUpKey && fetchState.failed;
  const isPendingFetch = shouldFetch && fetchState?.key !== catchUpKey;

  const loadPhase = resolveLoadPhase(
    request,
    resolvedEvents,
    isPendingFetch,
    fetchFailed,
  );

  if (loadPhase === "error") {
    return {
      loadPhase,
      events: [],
      errorMessage: "Couldn't load conversation.",
    };
  }

  if (fetchFailed && resolvedEvents.length > 0) {
    return {
      loadPhase: isTurnComplete(resolvedEvents) ? "ready" : "waiting",
      events: resolvedEvents,
    };
  }

  return {
    loadPhase,
    events: resolvedEvents,
  };
}
