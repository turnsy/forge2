import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function createEditPlanWorkspaceState(
  plan: WorkoutPlan,
  planId: string,
): PlanWorkspaceState {
  return {
    ...createInitialChatWorkspaceState<WorkoutPlan>(),
    hasStarted: true,
    artifactTitle: plan.name,
    currentArtifact: plan,
    planId,
  };
}
