import { defineState } from "eve/context";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type CoachArtifactState = {
  plan: WorkoutPlan | null;
  planId: string | null;
  title: string;
};

export const coachArtifact = defineState<CoachArtifactState>(
  "forge.coach-artifact",
  () => ({
    plan: null,
    planId: null,
    title: "",
  }),
);

export function setCoachArtifact(input: {
  plan: WorkoutPlan;
  planId?: string | null;
  title?: string;
}): void {
  coachArtifact.update((current) => ({
    plan: input.plan,
    planId: input.planId ?? current.planId,
    title: input.title ?? input.plan.name ?? current.title,
  }));
}

export function clearCoachArtifact(): void {
  coachArtifact.update(() => ({
    plan: null,
    planId: null,
    title: "",
  }));
}
