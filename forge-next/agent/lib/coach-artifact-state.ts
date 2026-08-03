import { defineState } from "eve/context";
import type { CoachAssignmentContext } from "@/lib/chat/assignment-context";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type CoachArtifactState = {
  plan: WorkoutPlan | null;
  planId: string | null;
  title: string;
  assignment: CoachAssignmentContext | null;
};

export const coachArtifact = defineState<CoachArtifactState>(
  "forge.coach-artifact",
  () => ({
    plan: null,
    planId: null,
    title: "",
    assignment: null,
  }),
);

export function setCoachArtifact(input: {
  plan: WorkoutPlan;
  planId?: string | null;
  title?: string;
  assignment?: CoachAssignmentContext | null;
}): void {
  coachArtifact.update((current) => ({
    plan: input.plan,
    planId: input.planId !== undefined ? input.planId : current.planId,
    title: input.title ?? input.plan.name ?? current.title,
    assignment:
      input.assignment !== undefined ? input.assignment : current.assignment,
  }));
}

export function clearCoachArtifact(): void {
  coachArtifact.update(() => ({
    plan: null,
    planId: null,
    title: "",
    assignment: null,
  }));
}
