import { describe, expect, it } from "vitest";
import { formatDaysPerWeek, getPlanStats } from "@/lib/plans/stats";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(weekDayCounts: number[], name = "Test Plan"): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name,
    weeks: weekDayCounts.map((dayCount, weekIndex) => ({
      index: weekIndex + 1,
      days: Array.from({ length: dayCount }, (_, dayIndex) => ({
        index: dayIndex + 1,
        code: `w${weekIndex + 1}d${dayIndex + 1}`,
        exercises: [
          {
            name: "Back Squat",
            sets: [
              {
                id: `w${weekIndex + 1}d${dayIndex + 1}-bs-1`,
                planned: {
                  type: "exact" as const,
                  reps: 5,
                  load: { type: "absolute" as const, value: 100, unit: "kg" as const },
                },
                actual: null,
                status: "planned" as const,
                locked: false,
              },
            ],
          },
        ],
      })),
    })) as WorkoutPlan["weeks"],
  };
}

describe("formatDaysPerWeek", () => {
  it("returns a number when min and max match", () => {
    expect(formatDaysPerWeek(4, 4)).toBe(4);
  });

  it("returns a range when min and max differ", () => {
    expect(formatDaysPerWeek(3, 4)).toBe("3–4");
  });
});

describe("getPlanStats", () => {
  it("returns zero counts for missing plan data", () => {
    expect(getPlanStats(null)).toEqual({ weekCount: 0, daysPerWeek: 0 });
    expect(getPlanStats(undefined)).toEqual({ weekCount: 0, daysPerWeek: 0 });
  });

  it("returns uniform days per week as a number", () => {
    expect(getPlanStats(makePlan([4, 4, 4]))).toEqual({
      weekCount: 3,
      daysPerWeek: 4,
    });
  });

  it("returns a range when weeks have different day counts", () => {
    expect(getPlanStats(makePlan([3, 4, 4]))).toEqual({
      weekCount: 3,
      daysPerWeek: "3–4",
    });
  });
});
