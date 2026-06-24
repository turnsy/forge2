import { describe, expect, it } from "vitest";
import { makeBlock, makeExercise, makeSet } from "@/lib/plans/__tests__/fixtures";
import { getPlanStats } from "@/lib/plans/stats";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(weekDayCounts: number[], name = "Test Plan"): WorkoutPlan {
  return {
    schemaVersion: "3.0.0",
    name,
    weeks: weekDayCounts.map((dayCount, weekIndex) => ({
      days: Array.from({ length: dayCount }, (_, dayIndex) => ({
        code: `w${weekIndex + 1}d${dayIndex + 1}`,
        blocks: [
          makeBlock({
            id: `w${weekIndex + 1}d${dayIndex + 1}-b1`,
            exercises: [
              makeExercise({
                id: `w${weekIndex + 1}d${dayIndex + 1}-bs`,
                name: "Back Squat",
                sets: [
                  makeSet({
                    id: `w${weekIndex + 1}d${dayIndex + 1}-bs-1`,
                    planned: {
                      type: "exact",
                      reps: 5,
                      target: { type: "absolute", value: 100, unit: "kg" },
                    },
                  }),
                ],
              }),
            ],
          }),
        ],
      })),
    })) as WorkoutPlan["weeks"],
  };
}

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
