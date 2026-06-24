import { describe, expect, it } from "vitest";
import { makeBlock } from "@/lib/plans/__tests__/fixtures";
import {
  isDayEditable,
  isExerciseEditable,
  isSetEditable,
} from "@/lib/plans/plan-editability";
import type { Day, Exercise, Set } from "@/lib/plans/workout-plan";

function makeSet(status: Set["status"]): Set {
  return {
    id: "set-1",
    planned: {
      type: "exact",
      reps: 5,
      target: { type: "absolute", value: 100, unit: "kg" },
    },
    actual: status === "completed" ? { reps: 5 } : null,
    status,
    locked: false,
  };
}

function makeExercise(sets: Set[]): Exercise {
  return {
    id: "back-squat",
    name: "Back Squat",
    sets: sets as Exercise["sets"],
  };
}

function makeDay(exercises: Exercise[]): Day {
  return {
    code: "w1d1",
    blocks: [makeBlock({ id: "w1d1-b1", exercises: exercises as Day["blocks"][number]["exercises"] })],
  };
}

describe("plan editability", () => {
  it("treats only planned sets as editable", () => {
    expect(isSetEditable(makeSet("planned"))).toBe(true);
    expect(isSetEditable(makeSet("completed"))).toBe(false);
    expect(isSetEditable(makeSet("skipped"))).toBe(false);
  });

  it("treats exercises with any planned set as editable", () => {
    const editable = makeExercise([makeSet("completed"), makeSet("planned")]);
    const locked = makeExercise([makeSet("completed"), makeSet("skipped")]);

    expect(isExerciseEditable(editable)).toBe(true);
    expect(isExerciseEditable(locked)).toBe(false);
  });

  it("treats days with any planned set as editable", () => {
    const editable = makeDay([
      makeExercise([makeSet("completed")]),
      makeExercise([makeSet("planned")]),
    ]);
    const locked = makeDay([makeExercise([makeSet("completed")])]);

    expect(isDayEditable(editable)).toBe(true);
    expect(isDayEditable(locked)).toBe(false);
  });
});
