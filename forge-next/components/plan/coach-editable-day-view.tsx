"use client";

import { PlanEditableDay } from "@/components/plan/plan-editable-day";
import type { Day, WorkoutPlan } from "@/lib/plans/workout-plan";

export type CoachEditableDayViewProps = {
  plan: WorkoutPlan;
  weekIndex: number;
  dayIndex: number;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
};

export function CoachEditableDayView({
  plan,
  weekIndex,
  dayIndex,
  disabled,
  onPlanChange,
}: CoachEditableDayViewProps) {
  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  const day = week?.days.find((candidate) => candidate.index === dayIndex);

  if (!day) {
    return <p className="text-sm text-surface-muted">Day not found</p>;
  }

  function handleDayChange(updatedDay: Day) {
    const newPlan = structuredClone(plan);
    const targetWeek = newPlan.weeks.find((candidate) => candidate.index === weekIndex);
    const targetDay = targetWeek?.days.find((candidate) => candidate.index === dayIndex);

    if (!targetWeek || !targetDay) {
      return;
    }

    const dayPosition = targetWeek.days.findIndex(
      (candidate) => candidate.index === dayIndex,
    );
    targetWeek.days[dayPosition] = updatedDay;
    onPlanChange(newPlan);
  }

  return <PlanEditableDay day={day} disabled={disabled} onChange={handleDayChange} />;
}
