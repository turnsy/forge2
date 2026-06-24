import { describe, expect, it } from "vitest";
import {
  makeBlock,
  makeDay,
  makeExercise,
  makeSet,
} from "@/lib/plans/__tests__/fixtures";
import { applyExerciseVideoLink } from "@/lib/plans/exercise-video-link";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "3.0.0",
    name: "Strength Block",
    weeks: [
      {
        days: [
          makeDay({
            code: "w1d1",
            blocks: [
              makeBlock({
                id: "w1d1-b1",
                exercises: [
                  makeExercise({
                    id: "bench-press-1",
                    name: "Bench Press",
                    sets: [
                      makeSet({
                        id: "s1",
                        planned: {
                          type: "exact",
                          reps: 5,
                          load: { type: "absolute", value: 135, unit: "lb" },
                        },
                      }),
                    ],
                  }),
                  makeExercise({
                    id: "pull-ups-1",
                    name: "Pull Ups",
                    sets: [
                      makeSet({
                        id: "s2",
                        planned: {
                          type: "exact",
                          reps: 8,
                          load: { type: "absolute", value: 0, unit: "lb" },
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          makeDay({
            code: "w1d2",
            blocks: [
              makeBlock({
                id: "w1d2-b1",
                exercises: [
                  makeExercise({
                    id: "bench-press-2",
                    name: "Bench Press",
                    sets: [
                      makeSet({
                        id: "s3",
                        planned: {
                          type: "exact",
                          reps: 3,
                          load: { type: "absolute", value: 185, unit: "lb" },
                        },
                        status: "completed",
                        locked: true,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
      {
        days: [
          makeDay({
            code: "w2d1",
            blocks: [
              makeBlock({
                id: "w2d1-b1",
                exercises: [
                  makeExercise({
                    id: "bench-press-3",
                    name: "bench press",
                    sets: [
                      makeSet({
                        id: "s4",
                        planned: {
                          type: "exact",
                          reps: 5,
                          load: { type: "absolute", value: 135, unit: "lb" },
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  };
}

describe("applyExerciseVideoLink", () => {
  it("sets videoUrl on a single exercise", () => {
    const result = applyExerciseVideoLink(makePlan(), {
      weekPos: 0,
      dayPos: 0,
      exercisePos: 0,
      exerciseName: "Bench Press",
      videoUrl: "https://youtu.be/example",
      addToAll: false,
    });

    expect(result.weeks[0].days[0].blocks[0].exercises[0].videoUrl).toBe("https://youtu.be/example");
    expect(result.weeks[0].days[0].blocks[0].exercises[1].videoUrl).toBeUndefined();
    expect(result.weeks[0].days[1].blocks[0].exercises[0].videoUrl).toBeUndefined();
  });

  it("clears videoUrl when given blank input", () => {
    const plan = makePlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].videoUrl = "https://youtu.be/old";

    const result = applyExerciseVideoLink(plan, {
      weekPos: 0,
      dayPos: 0,
      exercisePos: 0,
      exerciseName: "Bench Press",
      videoUrl: "   ",
      addToAll: false,
    });

    expect(result.weeks[0].days[0].blocks[0].exercises[0].videoUrl).toBeUndefined();
  });

  it("applies videoUrl to all same-named exercises when addToAll is true", () => {
    const result = applyExerciseVideoLink(makePlan(), {
      weekPos: 0,
      dayPos: 0,
      exercisePos: 0,
      exerciseName: "Bench Press",
      videoUrl: "https://youtu.be/shared",
      addToAll: true,
    });

    expect(result.weeks[0].days[0].blocks[0].exercises[0].videoUrl).toBe("https://youtu.be/shared");
    expect(result.weeks[0].days[1].blocks[0].exercises[0].videoUrl).toBe("https://youtu.be/shared");
    expect(result.weeks[1].days[0].blocks[0].exercises[0].videoUrl).toBeUndefined();
  });
});
