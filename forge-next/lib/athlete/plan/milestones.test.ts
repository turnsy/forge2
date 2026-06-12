import { describe, expect, it } from "vitest";
import {
  dayCompletedMilestone,
  milestoneDescription,
  milestoneTitle,
  planCompletedMilestone,
} from "@/lib/athlete/plan/milestones";
import type { CurrentDayLocation } from "@/lib/athlete/plan/domain";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

const currentDay: CurrentDayLocation = {
  weekIndex: 1,
  dayIndex: 1,
  week: minimalWorkoutPlan.weeks[0],
  day: minimalWorkoutPlan.weeks[0].days[0],
};

describe("athlete plan milestones", () => {
  it("builds day completed milestone copy", () => {
    const milestone = dayCompletedMilestone(currentDay);

    expect(milestone).toEqual({
      kind: "day",
      description: "Week 1 · Day 1",
    });
    expect(milestoneTitle(milestone)).toBe("Day completed!");
    expect(milestoneDescription(milestone)).toBe("Week 1 · Day 1");
  });

  it("builds plan completed milestone copy", () => {
    const milestone = planCompletedMilestone(minimalWorkoutPlan, "Coach Alex");

    expect(milestone).toEqual({
      kind: "plan",
      planName: "4-Week Strength Block",
      coachName: "Coach Alex",
    });
    expect(milestoneTitle(milestone)).toBe("All workouts complete! 🎉");
    expect(milestoneDescription(milestone)).toBe(
      "4-Week Strength Block with Coach Alex",
    );
  });
});
