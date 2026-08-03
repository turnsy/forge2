import type { ChatWorkspaceState } from "@/lib/chat/types";
import type { CoachAssignmentContext } from "@/lib/chat/assignment-context";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type PlanWorkspaceState = ChatWorkspaceState<WorkoutPlan> & {
  assignment: CoachAssignmentContext | null;
};
