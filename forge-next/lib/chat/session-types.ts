import type { ChatMessage, ChatWorkspaceState } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ChatSessionSnapshot = {
  title: string | null;
  messages: ChatMessage[];
  currentArtifact: WorkoutPlan | null;
  planId: string | null;
  artifactTitle: string;
  contextFileIds: string[];
};

export function buildSnapshotFromState(
  state: ChatWorkspaceState<WorkoutPlan>,
): ChatSessionSnapshot {
  return {
    title: state.sessionTitle,
    messages: state.messages,
    currentArtifact: state.currentArtifact,
    planId: state.planId,
    artifactTitle: state.artifactTitle,
    contextFileIds: state.contextFileIds,
  };
}
