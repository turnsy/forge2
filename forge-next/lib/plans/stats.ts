import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type PlanStats = {
  weekCount: number;
  daysPerWeek: number | string;
};

export function formatDaysPerWeek(min: number, max: number): number | string {
  if (max === 0) {
    return 0;
  }

  return min === max ? min : `${min}–${max}`;
}

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
    daysPerWeek: formatDaysPerWeek(min, max),
  };
}
