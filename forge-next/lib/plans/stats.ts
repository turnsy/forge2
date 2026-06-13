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
