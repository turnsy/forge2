import { createDefaultDay, isDefaultDayContent } from "@/lib/plans/plan-defaults";
import type { DaySelection } from "@/lib/plans/plan-day-navigator";
import type { Day, Week, WorkoutPlan } from "@/lib/plans/workout-plan";

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
        index: dayNumber,
        code: formatDayCode(weekNumber, dayNumber),
      };
    });

    return {
      ...week,
      index: weekNumber,
      days: days as typeof week.days,
    };
  });

  return {
    ...plan,
    weeks: weeks as typeof plan.weeks,
  };
}

function findWeekArrayIndex(plan: WorkoutPlan, weekIndex: number): number {
  return plan.weeks.findIndex((week) => week.index === weekIndex);
}

function findDayArrayIndex(week: Week, dayIndex: number): number {
  return week.days.findIndex((day) => day.index === dayIndex);
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

export function canRemoveDay(plan: WorkoutPlan, weekIndex: number): boolean {
  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  return Boolean(week && week.days.length > 1);
}

export function canMoveWeek(plan: WorkoutPlan, weekIndex: number, direction: -1 | 1): boolean {
  const weekPosition = findWeekArrayIndex(plan, weekIndex);
  if (weekPosition === -1) {
    return false;
  }

  const targetPosition = weekPosition + direction;
  return targetPosition >= 0 && targetPosition < plan.weeks.length;
}

export function canMoveDay(
  plan: WorkoutPlan,
  weekIndex: number,
  dayIndex: number,
  direction: -1 | 1,
): boolean {
  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  if (!week) {
    return false;
  }

  const dayPosition = findDayArrayIndex(week, dayIndex);
  if (dayPosition === -1) {
    return false;
  }

  const targetPosition = dayPosition + direction;
  return targetPosition >= 0 && targetPosition < week.days.length;
}

export function addWeek(plan: WorkoutPlan): WorkoutPlan {
  const nextPlan = clonePlan(plan);
  nextPlan.weeks.push({
    index: nextPlan.weeks.length + 1,
    days: [createDefaultDay()],
  });

  return syncPlanStructure(nextPlan);
}

export function addDay(plan: WorkoutPlan, weekIndex: number): WorkoutPlan {
  const nextPlan = clonePlan(plan);
  const weekPosition = findWeekArrayIndex(nextPlan, weekIndex);
  if (weekPosition === -1) {
    return plan;
  }

  nextPlan.weeks[weekPosition].days.push(createDefaultDay());
  return syncPlanStructure(nextPlan);
}

export function removeWeek(plan: WorkoutPlan, weekIndex: number): WorkoutPlan | null {
  if (!canRemoveWeek(plan)) {
    return null;
  }

  const weekPosition = findWeekArrayIndex(plan, weekIndex);
  if (weekPosition === -1) {
    return null;
  }

  const nextPlan = clonePlan(plan);
  nextPlan.weeks.splice(weekPosition, 1);
  return syncPlanStructure(nextPlan);
}

export function removeDay(
  plan: WorkoutPlan,
  weekIndex: number,
  dayIndex: number,
): WorkoutPlan | null {
  if (!canRemoveDay(plan, weekIndex)) {
    return null;
  }

  const nextPlan = clonePlan(plan);
  const weekPosition = findWeekArrayIndex(nextPlan, weekIndex);
  if (weekPosition === -1) {
    return null;
  }

  const dayPosition = findDayArrayIndex(nextPlan.weeks[weekPosition], dayIndex);
  if (dayPosition === -1) {
    return null;
  }

  nextPlan.weeks[weekPosition].days.splice(dayPosition, 1);
  return syncPlanStructure(nextPlan);
}

export function moveWeek(
  plan: WorkoutPlan,
  weekIndex: number,
  direction: -1 | 1,
): WorkoutPlan | null {
  if (!canMoveWeek(plan, weekIndex, direction)) {
    return null;
  }

  const weekPosition = findWeekArrayIndex(plan, weekIndex);
  if (weekPosition === -1) {
    return null;
  }

  const nextPlan = clonePlan(plan);
  nextPlan.weeks = moveListItem(
    nextPlan.weeks,
    weekPosition,
    weekPosition + direction,
  ) as typeof nextPlan.weeks;
  return syncPlanStructure(nextPlan);
}

export function moveDay(
  plan: WorkoutPlan,
  weekIndex: number,
  dayIndex: number,
  direction: -1 | 1,
): WorkoutPlan | null {
  if (!canMoveDay(plan, weekIndex, dayIndex, direction)) {
    return null;
  }

  const nextPlan = clonePlan(plan);
  const weekPosition = findWeekArrayIndex(nextPlan, weekIndex);
  if (weekPosition === -1) {
    return null;
  }

  const week = nextPlan.weeks[weekPosition];
  const dayPosition = findDayArrayIndex(week, dayIndex);
  if (dayPosition === -1) {
    return null;
  }

  week.days = moveListItem(
    week.days,
    dayPosition,
    dayPosition + direction,
  ) as typeof week.days;
  return syncPlanStructure(nextPlan);
}

export function resolveSelectionAfterAddWeek(plan: WorkoutPlan): DaySelection {
  const week = plan.weeks.at(-1);
  return {
    weekIndex: week?.index ?? 1,
    dayIndex: week?.days[0]?.index ?? 1,
  };
}

export function resolveSelectionAfterAddDay(
  plan: WorkoutPlan,
  weekIndex: number,
): DaySelection {
  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  const day = week?.days.at(-1);

  return {
    weekIndex,
    dayIndex: day?.index ?? 1,
  };
}

export function resolveSelectionAfterRemoveWeek(
  plan: WorkoutPlan,
  removedWeekArrayIndex: number,
): DaySelection {
  const targetPosition = Math.min(removedWeekArrayIndex, plan.weeks.length - 1);
  const week = plan.weeks[targetPosition];

  return {
    weekIndex: week?.index ?? 1,
    dayIndex: week?.days[0]?.index ?? 1,
  };
}

export function resolveSelectionAfterRemoveDay(
  plan: WorkoutPlan,
  weekIndex: number,
  removedDayArrayIndex: number,
): DaySelection {
  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  if (!week) {
    return { weekIndex: 1, dayIndex: 1 };
  }

  const targetPosition = Math.min(removedDayArrayIndex, week.days.length - 1);

  return {
    weekIndex,
    dayIndex: week.days[targetPosition]?.index ?? 1,
  };
}

export function resolveSelectionAfterMoveWeek(
  plan: WorkoutPlan,
  weekArrayIndex: number,
): DaySelection {
  const week = plan.weeks[weekArrayIndex];

  return {
    weekIndex: week?.index ?? 1,
    dayIndex: week?.days[0]?.index ?? 1,
  };
}

export function resolveSelectionAfterMoveDay(
  plan: WorkoutPlan,
  weekIndex: number,
  dayArrayIndex: number,
): DaySelection {
  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  const day = week?.days[dayArrayIndex];

  return {
    weekIndex,
    dayIndex: day?.index ?? 1,
  };
}

export function getWeekArrayIndex(plan: WorkoutPlan, weekIndex: number): number {
  return findWeekArrayIndex(plan, weekIndex);
}

export function getDayArrayIndex(plan: WorkoutPlan, weekIndex: number, dayIndex: number): number {
  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  if (!week) {
    return -1;
  }

  return findDayArrayIndex(week, dayIndex);
}

export function shouldConfirmDeleteWeek(plan: WorkoutPlan, weekIndex: number): boolean {
  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
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
