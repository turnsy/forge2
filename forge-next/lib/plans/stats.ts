import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type PlanStats = {
  weekCount: number;
  daysPerWeek: number | string;
};

export function getPlanStats(planData: WorkoutPlan | null | undefined): PlanStats {
  if (!planData?.weeks?.length) {
    return { weekCount: 0, daysPerWeek: 0 };
  }

  const weekCount = planData.weeks.length;
  const dayCounts = planData.weeks.map((week) => week.days?.length ?? 0);

  if (dayCounts.length === 0) {
    return { weekCount, daysPerWeek: 0 };
  }

  const min = Math.min(...dayCounts);
  const max = Math.max(...dayCounts);

  return {
    weekCount,
    daysPerWeek: max === 0 ? 0 : min === max ? min : `${min}–${max}`,
  };
}

function formatCountLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

export function formatPlanScheduleSummary(stats: PlanStats): string {
  const weeks = formatCountLabel(stats.weekCount, "week", "weeks");
  const daysPerWeek =
    typeof stats.daysPerWeek === "number"
      ? stats.daysPerWeek === 1
        ? "1 day/week"
        : `${stats.daysPerWeek} days/week`
      : `${stats.daysPerWeek} days/week`;

  return `${weeks} · ${daysPerWeek}`;
}
