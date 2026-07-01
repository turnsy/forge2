import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";
import type { CoachWorkspaceSnapshot } from "@/lib/chat/session-types";
import { snapshotHasConversation } from "@/lib/chat/snapshot-messages";
import { withForgeSessionId } from "@/lib/chat/session-types";
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
  snapshot: CoachWorkspaceSnapshot;
}): PlanWorkspaceState {
  const snapshot = withForgeSessionId(session.id, session.snapshot);

  return {
    ...createInitialChatWorkspaceState<WorkoutPlan>(session.id),
    hasStarted: snapshotHasConversation(snapshot),
    sessionTitle: snapshot.title,
  };
}
