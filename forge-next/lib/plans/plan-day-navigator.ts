import { findCurrentDay } from "@/lib/athlete/plan/domain";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
export { isDayEditable } from "@/lib/plans/plan-editability";
import { getDayTitle, getWeekTitle } from "@/lib/plans/display";
import type { Day, Week, WorkoutPlan } from "@/lib/plans/workout-plan";

export type PlanDayNavItem = {
  weekPos: number;
  dayPos: number;
  week: Week;
  day: Day;
};

export type DaySelection = {
  weekPos: number;
  dayPos: number;
};

export function buildPlanDayNavItems(plan: WorkoutPlan): PlanDayNavItem[] {
  const items: PlanDayNavItem[] = [];

  plan.weeks.forEach((week, weekPos) => {
    week.days.forEach((day, dayPos) => {
      items.push({ weekPos, dayPos, week, day });
    });
  });

  return items;
}

export function getWeekDropdownLabel(week: Week, weekPos: number): string {
  return getWeekTitle(week, weekPos);
}

export function getDayDropdownLabel(day: Day, dayPos: number): string {
  return getDayTitle(day, dayPos);
}

export function getMobileDayLabel(weekPos: number, dayPos: number): string {
  return `W${weekPos + 1} D${dayPos + 1}`;
}

export function getMobileDayHeaderLabel(week: Week, day: Day, weekPos: number, dayPos: number): string {
  return `${getWeekTitle(week, weekPos)}, ${getDayTitle(day, dayPos)}`;
}

export function findNavItemIndex(
  items: PlanDayNavItem[],
  weekPos: number,
  dayPos: number,
): number {
  return items.findIndex(
    (item) => item.weekPos === weekPos && item.dayPos === dayPos,
  );
}

export function getAdjacentDaySelection(
  items: PlanDayNavItem[],
  weekPos: number,
  dayPos: number,
  direction: "prev" | "next",
): DaySelection | null {
  const currentIndex = findNavItemIndex(items, weekPos, dayPos);
  if (currentIndex === -1) {
    return null;
  }

  const nextIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return null;
  }

  const item = items[nextIndex];
  return {
    weekPos: item.weekPos,
    dayPos: item.dayPos,
  };
}

export function resolveDayLocation(
  plan: WorkoutPlan,
  weekPos: number,
  dayPos: number,
): { week: Week; day: Day } | null {
  const week = plan.weeks[weekPos];
  if (!week) {
    return null;
  }

  const day = week.days[dayPos];
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
    const resolved = resolveDayLocation(plan, initialDay.weekPos, initialDay.dayPos);
    if (resolved) {
      return initialDay;
    }
  }

  if (view === "athlete") {
    const current = findCurrentDay(plan);
    if (current) {
      return {
        weekPos: current.weekPos,
        dayPos: current.dayPos,
      };
    }
  }

  return {
    weekPos: 0,
    dayPos: 0,
  };
}

export function clampDaySelectionForWeek(week: Week, dayPos: number): number {
  if (dayPos >= 0 && dayPos < week.days.length) {
    return dayPos;
  }

  return 0;
}
