import { flattenDayExercises } from "@/lib/plans/day-blocks";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { getPlanStats } from "@/lib/plans/stats";

/**
 * Compact text summary for plan-chat iterations. Never includes full artifact JSON.
 */
export function summarizePlan(plan: WorkoutPlan | null | undefined): string {
  if (!plan?.weeks?.length) {
    return "No existing plan (empty seed).";
  }

  const { weekCount, daysPerWeek } = getPlanStats(plan);
  const lines: string[] = [
    `Plan: ${plan.name}`,
    `Schema: ${plan.schemaVersion}`,
    `Weeks: ${weekCount}, days per week: ${daysPerWeek}`,
  ];

  if (plan.discipline) {
    lines.push(`Discipline: ${plan.discipline}`);
  }

  plan.weeks.slice(0, 8).forEach((week, weekPos) => {
    const dayCount = week.days?.length ?? 0;
    const weekLabel = week.label ?? week.name ?? `Week ${weekPos + 1}`;
    lines.push(`- ${weekLabel} (${dayCount} days)`);
    (week.days ?? []).slice(0, 7).forEach((day, dayPos) => {
      const exerciseNames = flattenDayExercises(day)
        .slice(0, 12)
        .map((exercise) => exercise.name)
        .join(", ");
      const dayLabel = day.name ?? day.code;
      lines.push(
        `  - Day ${dayPos + 1} (${dayLabel}): ${exerciseNames || "no exercises"}`,
      );
    });
    if ((week.days?.length ?? 0) > 7) {
      lines.push("  - … additional days omitted");
    }
  });

  if (plan.weeks.length > 8) {
    lines.push("- … additional weeks omitted");
  }

  return lines.join("\n");
}
