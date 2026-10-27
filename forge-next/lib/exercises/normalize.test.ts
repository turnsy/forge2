import { describe, expect, it } from "vitest";
import { normalizeExercise } from "./normalize";

describe("normalizeExercise", () => {
  it("normalizes only case and whitespace", () => {
    expect(normalizeExercise("  Back  Squat (high-bar) ")).toBe("back squat (high-bar)");
    expect(normalizeExercise("Bench  Press 75%")).toBe("bench press 75%");
    expect(normalizeExercise("Bench Press (dumbbell)")).not.toBe(normalizeExercise("Bench Press (barbell)"));
    expect(normalizeExercise("Clean & Jerk")).not.toBe(normalizeExercise("Clean and Jerk"));
  });
});
