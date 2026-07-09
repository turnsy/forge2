import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import type {
  ChatDisplayError,
  ChatMessage,
  ChatStatus,
  ChatWorkspacePhase,
} from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ForgeEvePointer = SessionState & {
  sessionId: string;
};

/**
 * Annotation for an event log that intentionally ends mid-turn. Eve's server
 * log stays the source of truth: loads still reconcile against the server, and
 * if the server has events past `eventCount` the marker is discarded.
 */
export type CoachTurnMarker = {
  status: "stopped" | "interrupted";
  eventCount: number;
};

export type CoachWorkspaceSnapshot = {
  title: string | null;
  forgeSessionId: string;
  eve: ForgeEvePointer | null;
  /** Persisted Eve stream events for reload — see eve SDK `initialEvents`. */
  eveEvents?: readonly HandleMessageStreamEvent[];
  /** Set when the last turn terminated without a server boundary event. */
  lastTurn?: CoachTurnMarker | null;
};

export type EveCoachReducerData = {
  messages: ChatMessage[];
  currentArtifact: WorkoutPlan | null;
  planId: string | null;
  artifactTitle: string;
  runStatus: ChatStatus | null;
  streamingAssistantText: string;
  errors: ChatDisplayError[];
  phase: ChatWorkspacePhase;
  warnings: string[];
};

export function withForgeSessionId(
  forgeSessionId: string,
  snapshot: CoachWorkspaceSnapshot,
): CoachWorkspaceSnapshot {
  return { ...snapshot, forgeSessionId };
}

export function buildCoachWorkspaceSnapshot(input: {
  forgeSessionId: string;
  title: string | null;
  eve: CoachWorkspaceSnapshot["eve"];
  eveEvents?: CoachWorkspaceSnapshot["eveEvents"];
  lastTurn?: CoachTurnMarker | null;
}): CoachWorkspaceSnapshot {
  return {
    title: input.title,
    forgeSessionId: input.forgeSessionId,
    eve: input.eve,
    ...(input.eveEvents !== undefined ? { eveEvents: input.eveEvents } : {}),
    ...(input.lastTurn !== undefined ? { lastTurn: input.lastTurn } : {}),
  };
}

/**
 * A marker only applies while the log still ends at the same place it was
 * written for. Once the server log advances past it, Eve wins.
 */
export function resolveActiveTurnMarker(
  marker: CoachTurnMarker | null | undefined,
  eventCount: number,
): CoachTurnMarker | null {
  if (!marker || marker.eventCount !== eventCount) {
    return null;
  }

  return marker;
}

export function getPersistedEveEvents(
  snapshot: CoachWorkspaceSnapshot,
): readonly HandleMessageStreamEvent[] {
  return snapshot.eveEvents ?? [];
}

export function hasPersistedEveEvents(snapshot: CoachWorkspaceSnapshot): boolean {
  return getPersistedEveEvents(snapshot).length > 0;
}

export function toEveSessionState(
  pointer: ForgeEvePointer,
  streamIndex?: number,
): SessionState {
  return {
    sessionId: pointer.sessionId,
    continuationToken: pointer.continuationToken,
    streamIndex: streamIndex ?? pointer.streamIndex ?? 0,
  };
}

export function toForgeEvePointer(session: SessionState): ForgeEvePointer | null {
  if (!session.sessionId) {
    return null;
  }

  return {
    sessionId: session.sessionId,
    continuationToken: session.continuationToken,
    streamIndex: session.streamIndex,
  };
}

export type { SessionState };
