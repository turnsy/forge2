import type { HandleMessageStreamEvent } from "eve/client";
import type { SessionState } from "eve/client";
import type {
  ChatDisplayError,
  ChatMessage,
  ChatStatus,
  ChatWorkspacePhase,
} from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type EveCoachSnapshot = {
  eve: {
    sessionId: string;
    continuationToken: string;
    streamIndex: number;
    events: HandleMessageStreamEvent[];
  } | null;
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
    return snapshot as CoachWorkspaceSnapshot;
  }

  const legacy = snapshot as CoachWorkspaceSnapshot;
  return {
    title: legacy.title ?? null,
    forgeSessionId,
    eve: legacy.eve ?? null,
    ui: {
      planId: legacy.planId ?? null,
      artifactTitle: legacy.artifactTitle ?? "",
      currentArtifact: legacy.currentArtifact ?? null,
    },
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
