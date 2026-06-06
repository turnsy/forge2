import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function createPlanSnapshot(
  plan: WorkoutPlan,
  title: string,
): string {
  return JSON.stringify({
    plan,
    title: title.trim(),
  });
}

export function hasUnsavedPlanChanges(
  current: { plan: WorkoutPlan | null; title: string },
  savedSnapshot: string,
): boolean {
  if (!current.plan) {
    return false;
  }

  return createPlanSnapshot(current.plan, current.title) !== savedSnapshot;
}
