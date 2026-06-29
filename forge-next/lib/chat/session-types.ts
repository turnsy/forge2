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
