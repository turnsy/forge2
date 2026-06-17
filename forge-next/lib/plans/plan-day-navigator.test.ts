import { describe, expect, it } from "vitest";
import {
  getAdjacentDaySelection,
  getMobileDayHeaderLabel,
  getWeekDropdownLabel,
} from "@/lib/plans/plan-day-navigator";
import { buildPlanDayNavItems } from "@/lib/plans/plan-day-navigator";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name: "Strength Block",
    weeks: [
      {
        index: 1,
        days: [
          { index: 1, code: "w1d1", exercises: [] },
          { index: 2, code: "w1d2", exercises: [] },
        ],
      },
      {
        index: 2,
        label: "Deload Week",
        days: [{ index: 1, code: "w2d1", exercises: [] }],
      },
    ],
  };
}

describe("plan day navigator domain", () => {
  it("formats the mobile header label", () => {
    expect(getMobileDayHeaderLabel(1, 1)).toBe("Week 1, Day 1");
  });

  it("returns week labels without index prefixes", () => {
    const plan = makePlan();
    expect(getWeekDropdownLabel(plan.weeks[0])).toBe("Week 1");
    expect(getWeekDropdownLabel(plan.weeks[1])).toBe("Deload Week");
    expect(getWeekDropdownLabel({ index: 3, days: [] })).toBe("Week 3");
  });

  it("returns adjacent day selections across week boundaries", () => {
    const items = buildPlanDayNavItems(makePlan());

    expect(getAdjacentDaySelection(items, 1, 1, "next")).toEqual({
      weekIndex: 1,
      dayIndex: 2,
    });
    expect(getAdjacentDaySelection(items, 1, 2, "next")).toEqual({
      weekIndex: 2,
      dayIndex: 1,
    });
    expect(getAdjacentDaySelection(items, 2, 1, "prev")).toEqual({
      weekIndex: 1,
      dayIndex: 2,
    });
    expect(getAdjacentDaySelection(items, 1, 1, "prev")).toBeNull();
    expect(getAdjacentDaySelection(items, 2, 1, "next")).toBeNull();
  });
});
