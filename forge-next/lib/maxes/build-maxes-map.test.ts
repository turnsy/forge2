import { describe, expect, it } from "vitest";
import { buildMaxesByExerciseId } from "./build-maxes-map";

describe("buildMaxesByExerciseId", () => {
  it("uses the best max per exercise", () => {
    expect(
      buildMaxesByExerciseId([
        {
          id: "m1",
          athlete_id: "a1",
          exercise_id: "bench",
          value: 100,
          unit: "kg",
          source: "athlete_entered",
          logged_at: "2026-02-01T00:00:00.000Z",
        },
        {
          id: "m2",
          athlete_id: "a1",
          exercise_id: "bench",
          value: 110,
          unit: "kg",
          source: "estimated_from_log",
          logged_at: "2026-01-01T00:00:00.000Z",
        },
      ]),
    ).toEqual({
      bench: { value: 110, unit: "kg" },
    });
  });
});
