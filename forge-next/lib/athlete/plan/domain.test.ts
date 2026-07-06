import { describe, expect, it } from "vitest";
import {
  makeBlock,
  makeDay,
  makeExercise,
  makeSet,
} from "@/lib/plans/__tests__/fixtures";
import {
  applySetActuals,
  areAllDaysComplete,
  buildActualForSave,
  buildActualFromInputs,
  completeDayInPlan,
  computePlanCompletionPercent,
  listFullySkippedDays,
  listResolvedDaysWithSkippedSets,
  dayHasSkippedSets,
  dayHasUnfilledNonTargetSets,
  findCurrentDay,
  isDayFullySkipped,
  isDayResolved,
  isExerciseComplete,
  isSetActualComplete,
  parseTargetInput,
  parseRepsInput,
  mergeSavedActual,
  resolveSaveActual,
  setFormStateFromActual,
} from "@/lib/athlete/plan/domain";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "3.0.0",
    name: "Test Plan",
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
                    id: "back-squat",
                    name: "Back Squat",
                    sets: [
                      makeSet({
                        id: "w1d1-bs-1",
                        planned: {
                          type: "exact",
                          reps: 8,
                          target: { type: "absolute", value: 60, unit: "kg" },
                        },
                      }),
                      makeSet({
                        id: "w1d1-bs-2",
                        planned: {
                          type: "exact",
                          reps: 6,
                          target: {
                            type: "percentage",
                            value: 75,
                            unit: "kg",
                          },
                        },
                      }),
                    ],
                  }),
                  makeExercise({
                    id: "conditioning",
                    name: "Conditioning",
                    sets: [
                      makeSet({
                        id: "w1d1-run-1",
                        planned: {
                          type: "target",
                          instruction: "Run 400m at RPE 7",
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
                    id: "bench-press",
                    name: "Bench Press",
                    sets: [
                      makeSet({
                        id: "w1d2-bp-1",
                        planned: {
                          type: "exact",
                          reps: 5,
                          target: { type: "absolute", value: 80, unit: "kg" },
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

describe("athlete plan domain", () => {
  it("finds the earliest day with planned sets", () => {
    const current = findCurrentDay(makePlan());

    expect(current).toEqual(
      expect.objectContaining({
        weekPos: 0,
        dayPos: 0,
      }),
    );
  });

  it("marks all days complete after every set is completed or skipped", () => {
    const plan = makePlan();
    const firstDay = completeDayInPlan(plan, 0, 0).plan;
    expect(areAllDaysComplete(firstDay)).toBe(false);

    const secondDay = completeDayInPlan(firstDay, 0, 1).plan;
    expect(areAllDaysComplete(secondDay)).toBe(true);
    expect(findCurrentDay(secondDay)).toBeNull();
  });

  it("builds actual values from absolute and percentage inputs", () => {
    const plan = makePlan();
    const absoluteSet = plan.weeks[0].days[0].blocks[0].exercises[0].sets[0];
    const percentageSet = plan.weeks[0].days[0].blocks[0].exercises[0].sets[1];

    expect(buildActualFromInputs("8", "60", absoluteSet)).toEqual({
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    });
    expect(buildActualFromInputs("3+1", "185", percentageSet)).toEqual({
      reps: "3+1",
      target: { type: "absolute", value: 185, unit: "kg" },
    });
    expect(buildActualFromInputs("3+1", "75%", percentageSet)).toEqual({
      reps: "3+1",
      target: { type: "percentage", value: 75, unit: "kg" },
    });
  });

  it("builds partial actual values for save when only reps are entered", () => {
    const plan = makePlan();
    const absoluteSet = plan.weeks[0].days[0].blocks[0].exercises[0].sets[0];

    expect(buildActualForSave("8", "", absoluteSet)).toEqual({ reps: 8 });
    expect(buildActualForSave("", "", absoluteSet)).toBeNull();
    expect(buildActualForSave("8", "60", absoluteSet)).toEqual({
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    });
  });

  it("reuses saved reps when only load input changes", () => {
    const plan = makePlan();
    const savedSet = {
      ...plan.weeks[0].days[0].blocks[0].exercises[0].sets[0],
      actual: {
        reps: 8,
        target: { type: "absolute" as const, value: 60, unit: "kg" as const },
      },
    };

    expect(buildActualForSave("", "65", savedSet)).toEqual({
      reps: 8,
      target: { type: "absolute", value: 65, unit: "kg" },
    });
  });

  it("hydrates form state from saved actual values", () => {
    const plan = makePlan();
    const absoluteSet = {
      ...plan.weeks[0].days[0].blocks[0].exercises[0].sets[0],
      actual: {
        reps: 8,
        target: { type: "absolute" as const, value: 60, unit: "kg" as const },
      },
    };

    expect(setFormStateFromActual(absoluteSet)).toEqual({
      reps: "8",
      target: "60",
    });
  });

  it("merges partial saves with existing actual values on the server", () => {
    const plan = makePlan();
    const withReps = applySetActuals(plan, 0, 0, 0, 0, { reps: 8 });
    const withLoad = applySetActuals(withReps, 0, 0, 0, 0, {
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    });

    expect(
      withLoad.weeks[0].days[0].blocks[0].exercises[0].sets[0].actual,
    ).toEqual({
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    });

    expect(
      mergeSavedActual(
        { reps: 8, target: { type: "absolute", value: 60, unit: "kg" } },
        { reps: 7 },
      ),
    ).toEqual({
      reps: 7,
      target: { type: "absolute", value: 60, unit: "kg" },
    });
  });

  it("skips wiping persisted actuals when both inputs are empty", () => {
    const plan = makePlan();
    const savedSet = {
      ...plan.weeks[0].days[0].blocks[0].exercises[0].sets[0],
      actual: {
        reps: 8,
        target: { type: "absolute" as const, value: 60, unit: "kg" as const },
      },
    };

    expect(resolveSaveActual("", "", savedSet)).toEqual({ type: "skip" });
    expect(resolveSaveActual("", "65", savedSet)).toEqual({
      type: "save",
      actual: {
        reps: 8,
        target: { type: "absolute", value: 65, unit: "kg" },
      },
    });
  });

  it("parses reps and load inputs", () => {
    const percentageLoad = {
      type: "percentage" as const,
      value: 80,
      unit: "kg" as const,
    };

    expect(parseRepsInput("3+1")).toBe("3+1");
    expect(parseRepsInput("8")).toBe(8);
    expect(parseTargetInput("185", percentageLoad)).toEqual({
      type: "absolute",
      value: 185,
      unit: "kg",
    });
    expect(parseTargetInput("75%", percentageLoad)?.value).toBe(75);
  });

  it("detects complete and incomplete actual sets", () => {
    const plan = makePlan();
    const absoluteSet = plan.weeks[0].days[0].blocks[0].exercises[0].sets[0];
    const targetSet = plan.weeks[0].days[0].blocks[0].exercises[1].sets[0];

    expect(isSetActualComplete(absoluteSet)).toBe(false);
    expect(
      isSetActualComplete({
        ...absoluteSet,
        actual: { reps: 8, target: { type: "absolute", value: 60, unit: "kg" } },
      }),
    ).toBe(true);
    expect(
      isSetActualComplete({
        ...targetSet,
        actual: { reps: 1 },
      }),
    ).toBe(true);
  });

  it("marks an exercise complete only when every set is complete", () => {
    const plan = makePlan();
    const exercise = plan.weeks[0].days[0].blocks[0].exercises[0];

    expect(isExerciseComplete(exercise)).toBe(false);

    exercise.sets[0].actual = {
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    };
    expect(isExerciseComplete(exercise)).toBe(false);

    exercise.sets[1].actual = {
      reps: 6,
      target: { type: "absolute", value: 75, unit: "kg" },
    };
    expect(isExerciseComplete(exercise)).toBe(true);
  });

  it("completes a day with filled sets and skips unfilled non-target sets", () => {
    const plan = makePlan();
    const filled = applySetActuals(plan, 0, 0, 0, 0, {
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    });

    const { plan: completed, setStatuses } = completeDayInPlan(filled, 0, 0);

    expect(setStatuses).toEqual([
      { setIndex: 0, status: "completed" },
      { setIndex: 1, status: "skipped" },
      { setIndex: 2, status: "completed" },
    ]);
    expect(
      completed.weeks[0].days[0].blocks[0].exercises[0].sets[1].status,
    ).toBe("skipped");
    expect(
      completed.weeks[0].days[0].blocks[0].exercises[0].sets[1].actual,
    ).toBeNull();
    expect(
      completed.weeks[0].days[0].blocks[0].exercises[1].sets[0].status,
    ).toBe("completed");
  });

  it("stores target completion without fabricating reps", () => {
    const plan = makePlan();
    const filled = applySetActuals(plan, 0, 0, 0, 0, {
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    });
    const filledBoth = applySetActuals(filled, 0, 0, 0, 1, {
      reps: 6,
      target: { type: "absolute", value: 185, unit: "kg" },
    });

    const { plan: completed } = completeDayInPlan(filledBoth, 0, 0);
    const targetSet = completed.weeks[0].days[0].blocks[0].exercises[1].sets[0];

    expect(targetSet.actual).toEqual(
      expect.objectContaining({
        completedAt: expect.any(String),
      }),
    );
    expect(targetSet.actual?.reps).toBeUndefined();
  });

  it("treats skipped sets as done for exercise completion", () => {
    const plan = makePlan();
    const exercise = plan.weeks[0].days[0].blocks[0].exercises[0];

    exercise.sets[0].actual = {
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    };
    exercise.sets[1].status = "skipped";

    expect(isExerciseComplete(exercise)).toBe(true);
  });

  it("detects unfilled non-target sets for skip dialog", () => {
    const plan = makePlan();
    const day = plan.weeks[0].days[0];
    expect(dayHasUnfilledNonTargetSets(day)).toBe(true);

    const filled = applySetActuals(plan, 0, 0, 0, 0, {
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    });
    const filledDay = applySetActuals(filled, 0, 0, 0, 1, {
      reps: 6,
      target: { type: "absolute", value: 185, unit: "kg" },
    }).weeks[0].days[0];

    expect(dayHasUnfilledNonTargetSets(filledDay)).toBe(false);
  });
});

describe("computePlanCompletionPercent", () => {
  function markAllSetsCompleted(plan: WorkoutPlan): WorkoutPlan {
    return {
      ...plan,
      weeks: plan.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          blocks: day.blocks.map((block) => ({
            ...block,
            exercises: block.exercises.map((exercise) => ({
              ...exercise,
              sets: exercise.sets.map((set) => ({
                ...set,
                status: "completed" as const,
                actual: set.actual ?? {
                  reps: 5,
                  target: { type: "absolute" as const, value: 100, unit: "kg" as const },
                },
              })),
            })),
          })),
        })),
      })),
    };
  }

  it("returns 0 when no days are complete", () => {
    expect(computePlanCompletionPercent(makePlan())).toBe(0);
  });

  it("returns 100 when every day is complete", () => {
    expect(computePlanCompletionPercent(markAllSetsCompleted(makePlan()))).toBe(100);
  });

  it("returns partial completion across multiple days", () => {
    const dayOne = makePlan().weeks[0].days[0];
    const dayTwo = makeDay({
      code: "w1d2",
      blocks: [
        makeBlock({
          id: "w1d2-b1",
          exercises: [
            makeExercise({
              id: "deadlift",
              name: "Deadlift",
              sets: [
                makeSet({
                  id: "w1d2-dl-1",
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
    });

    const twoDayPlan: WorkoutPlan = {
      ...makePlan(),
      weeks: [{ days: [dayOne, dayTwo] }],
    };

    const partialPlan: WorkoutPlan = {
      ...twoDayPlan,
      weeks: [
        {
          days: [
            markAllSetsCompleted({ ...twoDayPlan, weeks: [{ days: [dayOne] }] })
              .weeks[0].days[0],
            dayTwo,
          ],
        },
      ],
    };

    expect(computePlanCompletionPercent(partialPlan)).toBe(50);
  });

  it("counts resolved days with skipped sets toward completion", () => {
    const plan = makePlan();
    const { plan: resolvedDay } = completeDayInPlan(plan, 0, 0);

    expect(isDayResolved(resolvedDay.weeks[0].days[0])).toBe(true);
    expect(computePlanCompletionPercent(resolvedDay)).toBe(50);
  });

  it("does not count days that still have planned sets", () => {
    const plan = makePlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].sets[0].status = "skipped";

    expect(isDayResolved(plan.weeks[0].days[0])).toBe(false);
    expect(computePlanCompletionPercent(plan)).toBe(0);
  });
});

describe("day resolution helpers", () => {
  it("detects fully skipped days", () => {
    const plan = makePlan();
    const { plan: resolved } = completeDayInPlan(plan, 0, 0);
    const day = resolved.weeks[0].days[0];

    expect(dayHasSkippedSets(day)).toBe(true);
    expect(isDayFullySkipped(day)).toBe(false);
    expect(listFullySkippedDays(resolved)).toEqual([]);
  });

  it("lists days where every set is skipped", () => {
    const plan = makePlan();
    for (const exercise of plan.weeks[0].days[0].blocks[0].exercises) {
      exercise.sets = exercise.sets.map((set) => ({
        ...set,
        status: "skipped" as const,
      }));
    }

    expect(isDayFullySkipped(plan.weeks[0].days[0])).toBe(true);
    expect(isDayResolved(plan.weeks[0].days[0])).toBe(true);
    expect(listFullySkippedDays(plan)).toEqual([{ weekPos: 0, dayPos: 0 }]);
    expect(computePlanCompletionPercent(plan)).toBe(50);
  });

  it("treats findCurrentDay as the first day with planned sets after resolved days", () => {
    const plan = makePlan();
    const dayTwo = makeDay({
      code: "w1d2",
      blocks: [
        makeBlock({
          id: "w1d2-b1",
          exercises: [
            makeExercise({
              id: "bench-press",
              name: "Bench Press",
              sets: [makeSet({ id: "w1d2-bp-1" })],
            }),
          ],
        }),
      ],
    });
    const dayThree = makeDay({
      code: "w1d3",
      blocks: [
        makeBlock({
          id: "w1d3-b1",
          exercises: [
            makeExercise({
              id: "squat",
              name: "Squat",
              sets: [makeSet({ id: "w1d3-sq-1" })],
            }),
          ],
        }),
      ],
    });
    const threeDayPlan: WorkoutPlan = {
      ...plan,
      weeks: [{ days: [plan.weeks[0].days[0], dayTwo, dayThree] }],
    };

    const { plan: afterDayOne } = completeDayInPlan(threeDayPlan, 0, 0);
    for (const exercise of afterDayOne.weeks[0].days[1].blocks[0].exercises) {
      exercise.sets = exercise.sets.map((set) => ({
        ...set,
        status: "skipped" as const,
      }));
    }

    const current = findCurrentDay(afterDayOne);
    expect(current).toEqual(
      expect.objectContaining({
        weekPos: 0,
        dayPos: 2,
      }),
    );
    expect(computePlanCompletionPercent(afterDayOne)).toBe(67);
  });

  it("lists resolved days with skipped sets", () => {
    const plan = makePlan();
    const { plan: resolved } = completeDayInPlan(plan, 0, 0);

    expect(listResolvedDaysWithSkippedSets(resolved)).toEqual([
      { weekPos: 0, dayPos: 0 },
    ]);
    expect(listFullySkippedDays(resolved)).toEqual([]);
  });
});
