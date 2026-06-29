import type { SessionState } from "eve/client";
import type {
  ChatDisplayError,
  ChatMessage,
  ChatStatus,
  ChatWorkspacePhase,
} from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ForgeEvePointer = {
  sessionId: string;
  continuationToken: string;
};

export type CoachWorkspaceSnapshot = {
  title: string | null;
  forgeSessionId: string;
  eve: ForgeEvePointer | null;
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
}): CoachWorkspaceSnapshot {
  return {
    title: input.title,
    forgeSessionId: input.forgeSessionId,
    eve: input.eve,
  };
}

export function toEveSessionState(
  pointer: ForgeEvePointer,
  streamIndex = 0,
): SessionState {
  return {
    sessionId: pointer.sessionId,
    continuationToken: pointer.continuationToken,
    streamIndex,
  };
}

export type { SessionState };
