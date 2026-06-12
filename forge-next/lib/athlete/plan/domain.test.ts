import { describe, expect, it } from "vitest";
import {
  applySetActuals,
  areAllDaysComplete,
  buildActualForSave,
  buildActualFromInputs,
  completeDayInPlan,
  dayHasUnfilledNonTargetSets,
  findCurrentDay,
  isExerciseComplete,
  isSetActualComplete,
  parseLoadInput,
  parseRepsInput,
  mergeSavedActual,
  resolveSaveActual,
  setFormStateFromActual,
} from "@/lib/athlete/plan/domain";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name: "Test Plan",
    weeks: [
      {
        index: 1,
        days: [
          {
            index: 1,
            code: "w1d1",
            exercises: [
              {
                name: "Back Squat",
                sets: [
                  {
                    id: "w1d1-bs-1",
                    planned: {
                      type: "exact",
                      reps: 8,
                      load: { type: "absolute", value: 60, unit: "kg" },
                    },
                    actual: null,
                    status: "planned",
                    locked: false,
                  },
                  {
                    id: "w1d1-bs-2",
                    planned: {
                      type: "exact",
                      reps: 6,
                      load: {
                        type: "percentage",
                        unit: "%",
                        operator: "exact",
                        value: 75,
                      },
                    },
                    actual: null,
                    status: "planned",
                    locked: false,
                  },
                ],
              },
              {
                name: "Conditioning",
                sets: [
                  {
                    id: "w1d1-run-1",
                    planned: {
                      type: "target",
                      instruction: "Run 400m at RPE 7",
                    },
                    actual: null,
                    status: "planned",
                    locked: false,
                  },
                ],
              },
            ],
          },
          {
            index: 2,
            code: "w1d2",
            exercises: [
              {
                name: "Bench Press",
                sets: [
                  {
                    id: "w1d2-bp-1",
                    planned: {
                      type: "exact",
                      reps: 5,
                      load: { type: "absolute", value: 80, unit: "kg" },
                    },
                    actual: null,
                    status: "planned",
                    locked: false,
                  },
                ],
              },
            ],
          },
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
        weekIndex: 1,
        dayIndex: 1,
      }),
    );
  });

  it("marks all days complete after every set is completed or skipped", () => {
    const plan = makePlan();
    const firstDay = completeDayInPlan(plan, 1, 1).plan;
    expect(areAllDaysComplete(firstDay)).toBe(false);

    const secondDay = completeDayInPlan(firstDay, 1, 2).plan;
    expect(areAllDaysComplete(secondDay)).toBe(true);
    expect(findCurrentDay(secondDay)).toBeNull();
  });

  it("builds actual values from absolute and percentage inputs", () => {
    const plan = makePlan();
    const absoluteSet = plan.weeks[0].days[0].exercises[0].sets[0];
    const percentageSet = plan.weeks[0].days[0].exercises[0].sets[1];

    expect(buildActualFromInputs("8", "60", absoluteSet)).toEqual({
      reps: 8,
      load: { type: "absolute", value: 60, unit: "kg" },
    });
    expect(buildActualFromInputs("3+1", "75%", percentageSet)).toEqual({
      reps: "3+1",
      load: expect.objectContaining({ type: "percentage", value: 75 }),
    });
  });

  it("builds partial actual values for save when only reps are entered", () => {
    const plan = makePlan();
    const absoluteSet = plan.weeks[0].days[0].exercises[0].sets[0];

    expect(buildActualForSave("8", "", absoluteSet)).toEqual({ reps: 8 });
    expect(buildActualForSave("", "", absoluteSet)).toBeNull();
    expect(buildActualForSave("8", "60", absoluteSet)).toEqual({
      reps: 8,
      load: { type: "absolute", value: 60, unit: "kg" },
    });
  });

  it("reuses saved reps when only load input changes", () => {
    const plan = makePlan();
    const savedSet = {
      ...plan.weeks[0].days[0].exercises[0].sets[0],
      actual: {
        reps: 8,
        load: { type: "absolute" as const, value: 60, unit: "kg" as const },
      },
    };

    expect(buildActualForSave("", "65", savedSet)).toEqual({
      reps: 8,
      load: { type: "absolute", value: 65, unit: "kg" },
    });
  });

  it("hydrates form state from saved actual values", () => {
    const plan = makePlan();
    const absoluteSet = {
      ...plan.weeks[0].days[0].exercises[0].sets[0],
      actual: {
        reps: 8,
        load: { type: "absolute" as const, value: 60, unit: "kg" as const },
      },
    };

    expect(setFormStateFromActual(absoluteSet)).toEqual({
      reps: "8",
      load: "60",
    });
  });

  it("merges partial saves with existing actual values on the server", () => {
    const plan = makePlan();
    const withReps = applySetActuals(plan, 1, 1, 0, 0, { reps: 8 });
    const withLoad = applySetActuals(withReps, 1, 1, 0, 0, {
      reps: 8,
      load: { type: "absolute", value: 60, unit: "kg" },
    });

    expect(
      withLoad.weeks[0].days[0].exercises[0].sets[0].actual,
    ).toEqual({
      reps: 8,
      load: { type: "absolute", value: 60, unit: "kg" },
    });

    expect(
      mergeSavedActual(
        { reps: 8, load: { type: "absolute", value: 60, unit: "kg" } },
        { reps: 7 },
      ),
    ).toEqual({
      reps: 7,
      load: { type: "absolute", value: 60, unit: "kg" },
    });
  });

  it("skips wiping persisted actuals when both inputs are empty", () => {
    const plan = makePlan();
    const savedSet = {
      ...plan.weeks[0].days[0].exercises[0].sets[0],
      actual: {
        reps: 8,
        load: { type: "absolute" as const, value: 60, unit: "kg" as const },
      },
    };

    expect(resolveSaveActual("", "", savedSet)).toBeUndefined();
    expect(resolveSaveActual("", "65", savedSet)).toEqual({
      reps: 8,
      load: { type: "absolute", value: 65, unit: "kg" },
    });
  });

  it("parses reps and load inputs", () => {
    const percentageLoad = {
      type: "percentage" as const,
      unit: "%" as const,
      operator: "exact" as const,
      value: 80,
    };

    expect(parseRepsInput("3+1")).toBe("3+1");
    expect(parseRepsInput("8")).toBe(8);
    expect(parseLoadInput("75%", percentageLoad)?.value).toBe(75);
  });

  it("detects complete and incomplete actual sets", () => {
    const plan = makePlan();
    const absoluteSet = plan.weeks[0].days[0].exercises[0].sets[0];
    const targetSet = plan.weeks[0].days[0].exercises[1].sets[0];

    expect(isSetActualComplete(absoluteSet)).toBe(false);
    expect(
      isSetActualComplete({
        ...absoluteSet,
        actual: { reps: 8, load: { type: "absolute", value: 60, unit: "kg" } },
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
    const exercise = plan.weeks[0].days[0].exercises[0];

    expect(isExerciseComplete(exercise)).toBe(false);

    exercise.sets[0].actual = {
      reps: 8,
      load: { type: "absolute", value: 60, unit: "kg" },
    };
    expect(isExerciseComplete(exercise)).toBe(false);

    exercise.sets[1].actual = {
      reps: 6,
      load: { type: "percentage", unit: "%", operator: "exact", value: 75 },
    };
    expect(isExerciseComplete(exercise)).toBe(true);
  });

  it("completes a day with filled sets and skips unfilled non-target sets", () => {
    const plan = makePlan();
    const filled = applySetActuals(plan, 1, 1, 0, 0, {
      reps: 8,
      load: { type: "absolute", value: 60, unit: "kg" },
    });

    const { plan: completed, setStatuses } = completeDayInPlan(filled, 1, 1);

    expect(setStatuses).toEqual([
      { setIndex: 0, status: "completed" },
      { setIndex: 1, status: "skipped" },
      { setIndex: 2, status: "completed" },
    ]);
    expect(
      completed.weeks[0].days[0].exercises[0].sets[1].status,
    ).toBe("skipped");
    expect(
      completed.weeks[0].days[0].exercises[1].sets[0].status,
    ).toBe("completed");
  });

  it("detects unfilled non-target sets for skip dialog", () => {
    const plan = makePlan();
    const day = plan.weeks[0].days[0];
    expect(dayHasUnfilledNonTargetSets(day)).toBe(true);

    const filled = applySetActuals(plan, 1, 1, 0, 0, {
      reps: 8,
      load: { type: "absolute", value: 60, unit: "kg" },
    });
    const filledDay = applySetActuals(filled, 1, 1, 0, 1, {
      reps: 6,
      load: {
        type: "percentage",
        unit: "%",
        operator: "exact",
        value: 75,
      },
    }).weeks[0].days[0];

    expect(dayHasUnfilledNonTargetSets(filledDay)).toBe(false);
  });
});
