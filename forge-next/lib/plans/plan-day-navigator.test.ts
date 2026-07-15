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
    schemaVersion: "3.1.0",
    name: "Strength Block",
    weeks: [
      {
        days: [
          { code: "w1d1", blocks: [] },
          { code: "w1d2", blocks: [] },
        ],
      },
      {
        label: "Deload Week",
        days: [{ code: "w2d1", blocks: [] }],
      },
    ],
  };
}

describe("plan day navigator domain", () => {
  it("formats the mobile header label with week and day", () => {
    const plan = makePlan();
    expect(getMobileDayHeaderLabel(plan.weeks[0], plan.weeks[0].days[0], 0, 0)).toBe(
      "Week 1, Day 1",
    );
    expect(getMobileDayHeaderLabel(plan.weeks[1], plan.weeks[1].days[0], 1, 0)).toBe(
      "Deload Week, Day 1",
    );
  });

  it("returns week labels without index prefixes", () => {
    const plan = makePlan();
    expect(getWeekDropdownLabel(plan.weeks[0], 0)).toBe("Week 1");
    expect(getWeekDropdownLabel(plan.weeks[1], 1)).toBe("Deload Week");
    expect(getWeekDropdownLabel({ days: [] }, 2)).toBe("Week 3");
  });

  it("returns adjacent day selections across week boundaries", () => {
    const items = buildPlanDayNavItems(makePlan());

    expect(getAdjacentDaySelection(items, 0, 0, "next")).toEqual({
      weekPos: 0,
      dayPos: 1,
    });
    expect(getAdjacentDaySelection(items, 0, 1, "next")).toEqual({
      weekPos: 1,
      dayPos: 0,
    });
    expect(getAdjacentDaySelection(items, 1, 0, "prev")).toEqual({
      weekPos: 0,
      dayPos: 1,
    });
    expect(getAdjacentDaySelection(items, 0, 0, "prev")).toBeNull();
    expect(getAdjacentDaySelection(items, 1, 0, "next")).toBeNull();
  });
});
