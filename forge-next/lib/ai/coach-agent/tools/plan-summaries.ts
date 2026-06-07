import { summarizePlan } from "@/lib/plans/summarize-plan";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function toPlanToolSummary(plan: WorkoutPlan) {
  return summarizePlan(plan);
}
