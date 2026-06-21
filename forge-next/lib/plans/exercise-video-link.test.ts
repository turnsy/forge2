import { describe, expect, it } from "vitest";
import { applyExerciseVideoLink } from "@/lib/plans/exercise-video-link";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name: "Strength Block",
    weeks: [
      {
        index: 1,
        days: [
          {
            index: 1,
            code: "w1d1",
            exercises: [
              { name: "Bench Press", sets: [{ id: "s1", planned: { type: "exact", reps: 5, load: { type: "absolute", value: 135, unit: "lb" } }, actual: null, status: "planned", locked: false }] },
              { name: "Pull Ups", sets: [{ id: "s2", planned: { type: "exact", reps: 8, load: { type: "absolute", value: 0, unit: "lb" } }, actual: null, status: "planned", locked: false }] },
            ],
          },
          {
            index: 2,
            code: "w1d2",
            status: "completed",
            exercises: [
              { name: "Bench Press", sets: [{ id: "s3", planned: { type: "exact", reps: 3, load: { type: "absolute", value: 185, unit: "lb" } }, actual: null, status: "completed", locked: true }] },
            ],
          },
        ],
      },
      {
        index: 2,
        days: [
          {
            index: 1,
            code: "w2d1",
            exercises: [
              { name: "bench press", sets: [{ id: "s4", planned: { type: "exact", reps: 5, load: { type: "absolute", value: 135, unit: "lb" } }, actual: null, status: "planned", locked: false }] },
            ],
          },
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
      exerciseIndex: 0,
      exerciseName: "Bench Press",
      videoUrl: "https://youtu.be/example",
      addToAll: false,
    });

    expect(result.weeks[0].days[0].exercises[0].videoUrl).toBe("https://youtu.be/example");
    expect(result.weeks[0].days[0].exercises[1].videoUrl).toBeUndefined();
    expect(result.weeks[0].days[1].exercises[0].videoUrl).toBeUndefined();
  });

  it("clears videoUrl when given blank input", () => {
    const plan = makePlan();
    plan.weeks[0].days[0].exercises[0].videoUrl = "https://youtu.be/old";

    const result = applyExerciseVideoLink(plan, {
      weekIndex: 1,
      dayIndex: 1,
      exerciseIndex: 0,
      exerciseName: "Bench Press",
      videoUrl: "   ",
      addToAll: false,
    });

    expect(result.weeks[0].days[0].exercises[0].videoUrl).toBeUndefined();
  });

  it("applies videoUrl to all same-named exercises when addToAll is true", () => {
    const result = applyExerciseVideoLink(makePlan(), {
      weekIndex: 1,
      dayIndex: 1,
      exerciseIndex: 0,
      exerciseName: "Bench Press",
      videoUrl: "https://youtu.be/shared",
      addToAll: true,
    });

    expect(result.weeks[0].days[0].exercises[0].videoUrl).toBe("https://youtu.be/shared");
    expect(result.weeks[0].days[1].exercises[0].videoUrl).toBe("https://youtu.be/shared");
    expect(result.weeks[1].days[0].exercises[0].videoUrl).toBeUndefined();
  });
});
