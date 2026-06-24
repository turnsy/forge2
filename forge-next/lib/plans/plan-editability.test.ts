import { describe, expect, it } from "vitest";
import { makeBlock, makeExercise, makeStatusSet } from "@/lib/plans/__tests__/fixtures";
import {
  isDayEditable,
  isExerciseEditable,
  isSetEditable,
} from "@/lib/plans/plan-editability";
import type { Day, Exercise } from "@/lib/plans/workout-plan";

function makeDay(exercises: Exercise[]): Day {
  return {
    code: "w1d1",
    blocks: [makeBlock({ id: "w1d1-b1", exercises: exercises as Day["blocks"][number]["exercises"] })],
  };
}

describe("plan editability", () => {
  it("treats only planned sets as editable", () => {
    expect(isSetEditable(makeStatusSet("planned"))).toBe(true);
    expect(isSetEditable(makeStatusSet("completed"))).toBe(false);
    expect(isSetEditable(makeStatusSet("skipped"))).toBe(false);
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
