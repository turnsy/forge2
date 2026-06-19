import { describe, expect, it } from "vitest";
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
      load: { type: "absolute", value: 100, unit: "kg" },
    },
    actual: status === "completed" ? { reps: 5 } : null,
    status,
    locked: false,
  };
}

function makeExercise(sets: Set[]): Exercise {
  return {
    name: "Back Squat",
    sets: sets as Exercise["sets"],
  };
}

function makeDay(exercises: Exercise[]): Day {
  return {
    index: 1,
    code: "w1d1",
    exercises: exercises as Day["exercises"],
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
