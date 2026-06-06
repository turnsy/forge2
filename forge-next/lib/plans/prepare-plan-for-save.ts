import { loadWorkoutPlan, type WorkoutPlanValidationError } from "@/lib/plans/validate";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function mergePlanTitle(plan: WorkoutPlan, title: string): WorkoutPlan {
  const trimmed = title.trim();

  if (trimmed.length === 0) {
    return plan;
  }

  return {
    ...plan,
    name: trimmed,
  };
}

export type PreparePlanForSaveResult =
  | { ok: true; plan: WorkoutPlan }
  | { ok: false; errors: WorkoutPlanValidationError[] };

export function preparePlanForSave(
  plan: WorkoutPlan,
  title: string,
): PreparePlanForSaveResult {
  const merged = mergePlanTitle(plan, title);
  const result = loadWorkoutPlan(merged);

  if (!result.ok) {
    return { ok: false, errors: result.errors };
  }

  return { ok: true, plan: result.plan };
}
