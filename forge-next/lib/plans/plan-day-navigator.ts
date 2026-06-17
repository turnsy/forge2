import { findCurrentDay } from "@/lib/athlete/plan/domain";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import type { Day, Week, WorkoutPlan } from "@/lib/plans/workout-plan";

export type PlanDayNavItem = {
  weekIndex: number;
  dayIndex: number;
  week: Week;
  day: Day;
};

export type DaySelection = {
  weekIndex: number;
  dayIndex: number;
};

export function buildPlanDayNavItems(plan: WorkoutPlan): PlanDayNavItem[] {
  const items: PlanDayNavItem[] = [];

  for (const week of plan.weeks) {
    for (const day of week.days) {
      items.push({
        weekIndex: week.index,
        dayIndex: day.index,
        week,
        day,
      });
    }
  }

  return items;
}

export function getWeekDropdownLabel(week: Week): string {
  if (week.label?.trim()) {
    return `${week.index}: ${week.label.trim()}`;
  }

  if (week.name?.trim()) {
    return `${week.index}: ${week.name.trim()}`;
  }

  return `Week ${week.index}`;
}

export function getDayDropdownLabel(day: Day): string {
  return `Day ${day.index}`;
}

export function getMobileDayLabel(weekIndex: number, dayIndex: number): string {
  return `W${weekIndex} D${dayIndex}`;
}

export function getMobileDayHeaderLabel(weekIndex: number, dayIndex: number): string {
  return `Week ${weekIndex}, Day ${dayIndex}`;
}

export function findNavItemIndex(
  items: PlanDayNavItem[],
  weekIndex: number,
  dayIndex: number,
): number {
  return items.findIndex(
    (item) => item.weekIndex === weekIndex && item.dayIndex === dayIndex,
  );
}

export function getAdjacentDaySelection(
  items: PlanDayNavItem[],
  weekIndex: number,
  dayIndex: number,
  direction: "prev" | "next",
): DaySelection | null {
  const currentIndex = findNavItemIndex(items, weekIndex, dayIndex);
  if (currentIndex === -1) {
    return null;
  }

  const nextIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return null;
  }

  const item = items[nextIndex];
  return {
    weekIndex: item.weekIndex,
    dayIndex: item.dayIndex,
  };
}

export function getAdjacentWeekIndex(
  plan: WorkoutPlan,
  weekIndex: number,
  direction: "prev" | "next",
): number | null {
  const weekIndices = plan.weeks.map((week) => week.index);
  const currentIndex = weekIndices.indexOf(weekIndex);
  if (currentIndex === -1) {
    return null;
  }

  const nextIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= weekIndices.length) {
    return null;
  }

  return weekIndices[nextIndex];
}

export function resolveDayLocation(
  plan: WorkoutPlan,
  weekIndex: number,
  dayIndex: number,
): { week: Week; day: Day } | null {
  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  if (!week) {
    return null;
  }

  const day = week.days.find((candidate) => candidate.index === dayIndex);
  if (!day) {
    return null;
  }

  return { week, day };
}

export function getInitialDaySelection(
  plan: WorkoutPlan,
  view: PlanViewerView,
  initialDay?: DaySelection,
): DaySelection {
  if (initialDay) {
    const resolved = resolveDayLocation(plan, initialDay.weekIndex, initialDay.dayIndex);
    if (resolved) {
      return initialDay;
    }
  }

  if (view === "athlete") {
    const current = findCurrentDay(plan);
    if (current) {
      return {
        weekIndex: current.weekIndex,
        dayIndex: current.dayIndex,
      };
    }
  }

  const firstWeek = plan.weeks[0];
  const firstDay = firstWeek?.days[0];

  return {
    weekIndex: firstWeek?.index ?? 1,
    dayIndex: firstDay?.index ?? 1,
  };
}

export function clampDaySelectionForWeek(
  week: Week,
  dayIndex: number,
): number {
  const dayExists = week.days.some((day) => day.index === dayIndex);
  if (dayExists) {
    return dayIndex;
  }

  return week.days[0]?.index ?? 1;
}

export function isDayEditable(day: Day): boolean {
  return day.exercises.some((exercise) =>
    exercise.sets.some((set) => set.status === "planned"),
  );
}
