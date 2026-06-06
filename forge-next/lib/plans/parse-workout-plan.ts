import { loadWorkoutPlan } from "@/lib/plans/validate";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function parseWorkoutPlan(value: unknown): WorkoutPlan | null {
  const result = loadWorkoutPlan(value);
  return result.ok ? result.plan : null;
}
