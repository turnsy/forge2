import type { SessionState } from "eve/client";
import type {
  ChatDisplayError,
  ChatMessage,
  ChatStatus,
  ChatWorkspacePhase,
} from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type EveCoachSnapshot = {
  eve: SessionState | null;
};

export type CoachWorkspaceSnapshot = {
  title: string | null;
  forgeSessionId: string;
  eve: EveCoachSnapshot["eve"];
  ui: {
    planId: string | null;
    artifactTitle: string;
    currentArtifact: WorkoutPlan | null;
  };
  /** @deprecated Legacy snapshots only */
  messages?: ChatMessage[];
  /** @deprecated Legacy snapshots only */
  currentArtifact?: WorkoutPlan | null;
  planId?: string | null;
  artifactTitle?: string;
  contextFileIds?: string[];
};

/** @deprecated Use CoachWorkspaceSnapshot */
export type ChatSessionSnapshot = CoachWorkspaceSnapshot;

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

export function normalizeCoachWorkspaceSnapshot(
  forgeSessionId: string,
  snapshot: CoachWorkspaceSnapshot | Record<string, unknown>,
): CoachWorkspaceSnapshot {
  if ("ui" in snapshot && snapshot.ui && typeof snapshot.ui === "object") {
    const normalized = snapshot as CoachWorkspaceSnapshot;
    return {
      ...normalized,
      forgeSessionId,
      eve: normalizeEveSessionState(normalized.eve),
    };
  }

  const legacy = snapshot as CoachWorkspaceSnapshot & {
    eve?: SessionState & { events?: unknown[] };
  };
  return {
    title: legacy.title ?? null,
    forgeSessionId,
    eve: normalizeEveSessionState(legacy.eve),
    ui: {
      planId: legacy.planId ?? null,
      artifactTitle: legacy.artifactTitle ?? "",
      currentArtifact: legacy.currentArtifact ?? null,
    },
  };
}

function normalizeEveSessionState(
  eve:
    | (SessionState & { events?: unknown[] })
    | null
    | undefined,
): SessionState | null {
  if (!eve) {
    return null;
  }

  if (!eve.sessionId) {
    return null;
  }

  return {
    sessionId: eve.sessionId,
    continuationToken: eve.continuationToken,
    streamIndex: eve.streamIndex ?? 0,
  };
}

export function buildCoachWorkspaceSnapshot(input: {
  forgeSessionId: string;
  title: string | null;
  ui: CoachWorkspaceSnapshot["ui"];
  eve: EveCoachSnapshot["eve"];
}): CoachWorkspaceSnapshot {
  return {
    title: input.title,
    forgeSessionId: input.forgeSessionId,
    eve: input.eve,
    ui: input.ui,
  };
}

export type { SessionState };
