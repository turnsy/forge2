import type { ChatWorkspaceState } from "@/lib/chat/types";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function buildSnapshotFromState(
  state: ChatWorkspaceState<WorkoutPlan>,
): ChatSessionSnapshot {
  return {
    messages: state.messages,
    currentArtifact: state.currentArtifact,
    planId: state.planId,
    artifactTitle: state.artifactTitle,
    contextFileIds: state.contextFileIds,
  };
}
