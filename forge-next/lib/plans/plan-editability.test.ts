import { describe, expect, it } from "vitest";
import {
  makeBlock,
  makeExercise,
  makeSet,
  makeStatusSet,
  makeWorkoutPlan,
  minimalWorkoutPlan,
} from "@/lib/plans/__tests__/fixtures";
import {
  assertEditableChange,
  isDayEditable,
  isExerciseEditable,
  isSetEditable,
} from "@/lib/plans/plan-editability";
import type { Day, Exercise } from "@/lib/plans/workout-plan";

function makeDay(exercises: Exercise[]): Day {
  return {
    code: "w1d1",
    blocks: [
      makeBlock({
        id: "w1d1-b1",
        exercises: exercises as Day["blocks"][number]["exercises"],
      }),
    ],
  };
}

describe("plan editability", () => {
  it("treats only planned, unlocked sets as editable", () => {
    expect(isSetEditable(makeStatusSet("planned"))).toBe(true);
    expect(isSetEditable(makeStatusSet("completed"))).toBe(false);
    expect(isSetEditable(makeStatusSet("skipped"))).toBe(false);
    expect(
      isSetEditable({
        ...makeStatusSet("planned"),
        locked: true,
      }),
    ).toBe(false);
  });

  it("treats exercises with any editable set as editable", () => {
    const editable = makeExercise({
      name: "Back Squat",
      sets: [makeStatusSet("planned")],
    });
    const locked = makeExercise({
      name: "Back Squat",
      sets: [makeStatusSet("completed")],
    });

    expect(isExerciseEditable(editable)).toBe(true);
    expect(isExerciseEditable(locked)).toBe(false);
  });

  it("treats days with any editable exercise as editable", () => {
    const editableDay = makeDay([
      makeExercise({ name: "A", sets: [makeStatusSet("planned")] }),
    ]);
    const lockedDay = makeDay([
      makeExercise({ name: "A", sets: [makeStatusSet("completed")] }),
    ]);

    expect(isDayEditable(editableDay)).toBe(true);
    expect(isDayEditable(lockedDay)).toBe(false);
  });
});

describe("assertEditableChange", () => {
  it("allows edits to planned sets", () => {
    const before = minimalWorkoutPlan;
    const after = structuredClone(before);
    after.weeks[0].days[0].blocks[0].exercises[0].sets[0].planned = {
      type: "exact",
      reps: 6,
      target: { type: "absolute", value: 110, unit: "kg" },
    };

    expect(assertEditableChange(before, after)).toEqual([]);
  });

  it("allows structural additions", () => {
    const before = minimalWorkoutPlan;
    const after = structuredClone(before);
    after.weeks[0].days[0].blocks[0].exercises[0].sets.push(
      makeSet({
        id: "w1d1-bs-2",
        planned: {
          type: "exact",
          reps: 5,
          target: { type: "absolute", value: 90, unit: "kg" },
        },
      }),
    );

    expect(assertEditableChange(before, after)).toEqual([]);
  });

  it("rejects edits to completed sets", () => {
    const before = makeWorkoutPlan({ dayComplete: true });
    const after = structuredClone(before);
    after.weeks[0].days[0].blocks[0].exercises[0].sets[0].planned = {
      type: "exact",
      reps: 6,
      target: { type: "absolute", value: 110, unit: "kg" },
    };

    const errors = assertEditableChange(before, after);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.message).toMatch(/completed|locked/i);
  });

  it("rejects edits to locked sets", () => {
    const before = makeWorkoutPlan();
    before.weeks[0].days[0].blocks[0].exercises[0].sets[0].locked = true;
    const after = structuredClone(before);
    after.weeks[0].days[0].blocks[0].exercises[0].sets[0].planned = {
      type: "exact",
      reps: 6,
      target: { type: "absolute", value: 110, unit: "kg" },
    };

    const errors = assertEditableChange(before, after);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]?.message).toMatch(/locked/i);
  });

  it("rejects status changes", () => {
    const before = makeWorkoutPlan();
    const after = structuredClone(before);
    after.weeks[0].days[0].blocks[0].exercises[0].sets[0].status = "completed";

    const errors = assertEditableChange(before, after);
    expect(errors.some((error) => error.message.includes("status"))).toBe(true);
  });

  it("rejects actual changes", () => {
    const before = makeWorkoutPlan();
    const after = structuredClone(before);
    after.weeks[0].days[0].blocks[0].exercises[0].sets[0].actual = {
      reps: 8,
      target: { type: "absolute", value: 60, unit: "kg" },
    };

    const errors = assertEditableChange(before, after);
    expect(errors.some((error) => error.message.includes("actual"))).toBe(true);
  });

  it("rejects removing completed sets", () => {
    const before = makeWorkoutPlan({ dayComplete: true, includeSkippedSet: true });
    const after = structuredClone(before);
    after.weeks[0].days[0].blocks[0].exercises[0].sets =
      after.weeks[0].days[0].blocks[0].exercises[0].sets.slice(0, 1);

    const errors = assertEditableChange(before, after);
    expect(errors.length).toBeGreaterThan(0);
  });
});
