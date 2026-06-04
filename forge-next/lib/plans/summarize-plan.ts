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

  for (const week of plan.weeks.slice(0, 8)) {
    const dayCount = week.days?.length ?? 0;
    const weekLabel = week.label ?? week.name ?? `Week ${week.index}`;
    lines.push(`- ${weekLabel} (${dayCount} days)`);
    for (const day of (week.days ?? []).slice(0, 7)) {
      const exerciseNames = (day.exercises ?? [])
        .slice(0, 12)
        .map((exercise) => exercise.name)
        .join(", ");
      const dayLabel = day.name ?? day.code;
      lines.push(
        `  - Day ${day.index} (${dayLabel}): ${exerciseNames || "no exercises"}`,
      );
    }
    if ((week.days?.length ?? 0) > 7) {
      lines.push("  - … additional days omitted");
    }
  }

  if (plan.weeks.length > 8) {
    lines.push("- … additional weeks omitted");
  }

  return lines.join("\n");
}
