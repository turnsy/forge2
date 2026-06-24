import { createDefaultDay, isDefaultDayContent } from "@/lib/plans/plan-defaults";
import type { DaySelection } from "@/lib/plans/plan-day-navigator";
import type { Day, WorkoutPlan } from "@/lib/plans/workout-plan";

export function formatDayCode(weekNumber: number, dayNumber: number): string {
  return `w${weekNumber}d${dayNumber}`;
}

export function syncPlanStructure(plan: WorkoutPlan): WorkoutPlan {
  const weeks = plan.weeks.map((week, weekPosition) => {
    const weekNumber = weekPosition + 1;
    const days = week.days.map((day, dayPosition) => {
      const dayNumber = dayPosition + 1;

      return {
        ...day,
        code: formatDayCode(weekNumber, dayNumber),
      };
    });

    return {
      ...week,
      days: days as typeof week.days,
    };
  });

  return {
    ...plan,
    weeks: weeks as typeof plan.weeks,
  };
}

function moveListItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex === toIndex) {
    return items;
  }

  const nextItems = [...items];
  const [moved] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, moved);
  return nextItems;
}

function clonePlan(plan: WorkoutPlan): WorkoutPlan {
  return structuredClone(plan);
}

export function canRemoveWeek(plan: WorkoutPlan): boolean {
  return plan.weeks.length > 1;
}

export function canRemoveDay(plan: WorkoutPlan, weekPos: number): boolean {
  const week = plan.weeks[weekPos];
  return Boolean(week && week.days.length > 1);
}

export function canMoveWeek(plan: WorkoutPlan, weekPos: number, direction: -1 | 1): boolean {
  const targetPosition = weekPos + direction;
  return weekPos >= 0 && weekPos < plan.weeks.length && targetPosition >= 0 && targetPosition < plan.weeks.length;
}

export function canMoveDay(
  plan: WorkoutPlan,
  weekPos: number,
  dayPos: number,
  direction: -1 | 1,
): boolean {
  const week = plan.weeks[weekPos];
  if (!week) {
    return false;
  }

  const targetPosition = dayPos + direction;
  return dayPos >= 0 && dayPos < week.days.length && targetPosition >= 0 && targetPosition < week.days.length;
}

export function addWeek(plan: WorkoutPlan): WorkoutPlan {
  const nextPlan = clonePlan(plan);
  nextPlan.weeks.push({
    days: [createDefaultDay()],
  });

  return syncPlanStructure(nextPlan);
}

export function addDay(plan: WorkoutPlan, weekPos: number): WorkoutPlan {
  const nextPlan = clonePlan(plan);
  const week = nextPlan.weeks[weekPos];
  if (!week) {
    return plan;
  }

  week.days.push(createDefaultDay());
  return syncPlanStructure(nextPlan);
}

export function removeWeek(plan: WorkoutPlan, weekPos: number): WorkoutPlan | null {
  if (!canRemoveWeek(plan) || !plan.weeks[weekPos]) {
    return null;
  }

  const nextPlan = clonePlan(plan);
  nextPlan.weeks.splice(weekPos, 1);
  return syncPlanStructure(nextPlan);
}

export function removeDay(
  plan: WorkoutPlan,
  weekPos: number,
  dayPos: number,
): WorkoutPlan | null {
  if (!canRemoveDay(plan, weekPos) || !plan.weeks[weekPos]?.days[dayPos]) {
    return null;
  }

  const nextPlan = clonePlan(plan);
  nextPlan.weeks[weekPos].days.splice(dayPos, 1);
  return syncPlanStructure(nextPlan);
}

export function moveWeek(
  plan: WorkoutPlan,
  weekPos: number,
  direction: -1 | 1,
): WorkoutPlan | null {
  if (!canMoveWeek(plan, weekPos, direction)) {
    return null;
  }

  const nextPlan = clonePlan(plan);
  nextPlan.weeks = moveListItem(
    nextPlan.weeks,
    weekPos,
    weekPos + direction,
  ) as typeof nextPlan.weeks;
  return syncPlanStructure(nextPlan);
}

export function moveDay(
  plan: WorkoutPlan,
  weekPos: number,
  dayPos: number,
  direction: -1 | 1,
): WorkoutPlan | null {
  if (!canMoveDay(plan, weekPos, dayPos, direction)) {
    return null;
  }

  const nextPlan = clonePlan(plan);
  const week = nextPlan.weeks[weekPos];
  week.days = moveListItem(
    week.days,
    dayPos,
    dayPos + direction,
  ) as typeof week.days;
  return syncPlanStructure(nextPlan);
}

export function resolveSelectionAfterAddWeek(plan: WorkoutPlan): DaySelection {
  const weekPos = plan.weeks.length - 1;

  return {
    weekPos: Math.max(weekPos, 0),
    dayPos: 0,
  };
}

export function resolveSelectionAfterAddDay(
  plan: WorkoutPlan,
  weekPos: number,
): DaySelection {
  const week = plan.weeks[weekPos];
  const dayPos = (week?.days.length ?? 1) - 1;

  return {
    weekPos,
    dayPos: Math.max(dayPos, 0),
  };
}

export function resolveSelectionAfterRemoveWeek(
  plan: WorkoutPlan,
  removedWeekPos: number,
): DaySelection {
  const targetPosition = Math.min(removedWeekPos, plan.weeks.length - 1);

  return {
    weekPos: Math.max(targetPosition, 0),
    dayPos: 0,
  };
}

export function resolveSelectionAfterRemoveDay(
  plan: WorkoutPlan,
  weekPos: number,
  removedDayPos: number,
): DaySelection {
  const week = plan.weeks[weekPos];
  if (!week) {
    return { weekPos: 0, dayPos: 0 };
  }

  const targetPosition = Math.min(removedDayPos, week.days.length - 1);

  return {
    weekPos,
    dayPos: Math.max(targetPosition, 0),
  };
}

export function resolveSelectionAfterMoveWeek(
  plan: WorkoutPlan,
  weekPos: number,
): DaySelection {
  return {
    weekPos: Math.min(Math.max(weekPos, 0), plan.weeks.length - 1),
    dayPos: 0,
  };
}

export function resolveSelectionAfterMoveDay(
  weekPos: number,
  dayPos: number,
): DaySelection {
  return {
    weekPos,
    dayPos,
  };
}

export function shouldConfirmDeleteWeek(plan: WorkoutPlan, weekPos: number): boolean {
  const week = plan.weeks[weekPos];
  if (!week) {
    return false;
  }

  if (week.days.length > 1) {
    return true;
  }

  return !isDefaultDayContent(week.days[0]);
}

export function shouldConfirmDeleteDay(day: Day): boolean {
  return !isDefaultDayContent(day);
}
