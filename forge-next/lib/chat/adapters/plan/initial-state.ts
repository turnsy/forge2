import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function createEditPlanWorkspaceState(
  plan: WorkoutPlan,
  planId?: string,
): PlanWorkspaceState {
  return {
    ...createInitialChatWorkspaceState<WorkoutPlan>(),
    hasStarted: true,
    artifactTitle: plan.name,
    currentArtifact: plan,
    planId: planId ?? null,
  };
}

export function createSessionWorkspaceState(session: {
  id: string;
  snapshot: ChatSessionSnapshot;
}): PlanWorkspaceState {
  return {
    ...createInitialChatWorkspaceState<WorkoutPlan>(session.id),
    hasStarted: session.snapshot.messages.length > 0,
    messages: session.snapshot.messages,
    currentArtifact: session.snapshot.currentArtifact,
    planId: session.snapshot.planId,
    artifactTitle: session.snapshot.artifactTitle,
    contextFileIds: session.snapshot.contextFileIds,
  };
}
