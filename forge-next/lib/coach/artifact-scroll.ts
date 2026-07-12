import type { WorkoutPlan } from "@/lib/plans/workout-plan";

/** Stable shape fingerprint for detecting agent artifact loads vs in-place edits. */
export function artifactStructureKey(plan: WorkoutPlan): string {
  return plan.weeks
    .map((week) => week.days.map((day) => day.blocks.length).join("."))
    .join("|");
}
