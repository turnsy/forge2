"use client";

import { PlanEditableDay } from "@/components/plan/plan-editable-day";
import {
  isExerciseEditable,
  isSetEditable,
} from "@/lib/plans/plan-editability";
import type { Day, Exercise, Set, WorkoutPlan } from "@/lib/plans/workout-plan";

export type CoachEditableDayViewProps = {
  plan: WorkoutPlan;
  weekPos: number;
  dayPos: number;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
  isSetEditable?: (set: Set) => boolean;
  isExerciseEditable?: (exercise: Exercise) => boolean;
};

export function CoachEditableDayView({
  plan,
  weekPos,
  dayPos,
  disabled,
  onPlanChange,
  isSetEditable: isSetEditableProp = isSetEditable,
  isExerciseEditable: isExerciseEditableProp = isExerciseEditable,
}: CoachEditableDayViewProps) {
  const day = plan.weeks[weekPos]?.days[dayPos];
  if (!day) return <p className="text-sm text-surface-muted">Day not found</p>;

  function handleDayChange(updatedDay: Day) {
    const next = structuredClone(plan);
    next.weeks[weekPos].days[dayPos] = updatedDay;
    onPlanChange(next);
  }

  return (
    <PlanEditableDay
      day={day}
      dayPos={dayPos}
      disabled={disabled}
      onChange={handleDayChange}
      isSetEditable={isSetEditableProp}
      isExerciseEditable={isExerciseEditableProp}
    />
  );
}
