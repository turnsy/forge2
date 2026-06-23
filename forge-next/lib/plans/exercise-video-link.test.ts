import { describe, expect, it } from "vitest";
import { applyExerciseVideoLink } from "@/lib/plans/exercise-video-link";
import { dayFromExercises, getBlockExercise } from "@/lib/plans/__tests__/fixtures";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "2.1.0",
    name: "Strength Block",
    weeks: [
      {
        index: 1,
        days: [
          dayFromExercises(
            [
              {
                name: "Bench Press",
                sets: [{ id: "s1", planned: { type: "exact", reps: 5, load: { type: "absolute", value: 135, unit: "lb" } }, actual: null, status: "planned", locked: false }],
              },
              {
                name: "Pull Ups",
                sets: [{ id: "s2", planned: { type: "exact", reps: 8, load: { type: "absolute", value: 0, unit: "lb" } }, actual: null, status: "planned", locked: false }],
              },
            ],
            { index: 1, code: "w1d1" },
          ),
          dayFromExercises(
            [
              {
                name: "Bench Press",
                sets: [{ id: "s3", planned: { type: "exact", reps: 3, load: { type: "absolute", value: 185, unit: "lb" } }, actual: null, status: "completed", locked: true }],
              },
            ],
            { index: 2, code: "w1d2" },
          ),
        ],
      },
      {
        index: 2,
        days: [
          dayFromExercises(
            [
              {
                name: "bench press",
                sets: [{ id: "s4", planned: { type: "exact", reps: 5, load: { type: "absolute", value: 135, unit: "lb" } }, actual: null, status: "planned", locked: false }],
              },
            ],
            { index: 1, code: "w2d1" },
          ),
        ],
      },
    ],
  };
}

describe("applyExerciseVideoLink", () => {
  it("sets videoUrl on a single exercise", () => {
    const result = applyExerciseVideoLink(makePlan(), {
      weekIndex: 1,
      dayIndex: 1,
      blockIndex: 0,
      exerciseIndex: 0,
      exerciseName: "Bench Press",
      videoUrl: "https://youtu.be/example",
      addToAll: false,
    });

    expect(getBlockExercise(result.weeks[0].days[0], 0).videoUrl).toBe("https://youtu.be/example");
    expect(getBlockExercise(result.weeks[0].days[0], 1).videoUrl).toBeUndefined();
    expect(getBlockExercise(result.weeks[0].days[1], 0).videoUrl).toBeUndefined();
  });

  it("clears videoUrl when given blank input", () => {
    const plan = makePlan();
    getBlockExercise(plan.weeks[0].days[0], 0).videoUrl = "https://youtu.be/old";

    const result = applyExerciseVideoLink(plan, {
      weekIndex: 1,
      dayIndex: 1,
      blockIndex: 0,
      exerciseIndex: 0,
      exerciseName: "Bench Press",
      videoUrl: "   ",
      addToAll: false,
    });

    expect(getBlockExercise(result.weeks[0].days[0], 0).videoUrl).toBeUndefined();
  });

  it("applies videoUrl to all same-named exercises when addToAll is true", () => {
    const result = applyExerciseVideoLink(makePlan(), {
      weekIndex: 1,
      dayIndex: 1,
      blockIndex: 0,
      exerciseIndex: 0,
      exerciseName: "Bench Press",
      videoUrl: "https://youtu.be/shared",
      addToAll: true,
    });

    expect(getBlockExercise(result.weeks[0].days[0], 0).videoUrl).toBe("https://youtu.be/shared");
    expect(getBlockExercise(result.weeks[0].days[1], 0).videoUrl).toBe("https://youtu.be/shared");
    expect(getBlockExercise(result.weeks[1].days[0], 0).videoUrl).toBeUndefined();
  });
});
