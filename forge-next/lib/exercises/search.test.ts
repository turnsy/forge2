import { describe, expect, it } from "vitest";
import { isAutoResolvable, mergeExerciseSearchOptions } from "./search";

describe("mergeExerciseSearchOptions", () => {
  it("dedupes by id and preserves group order", () => {
    expect(
      mergeExerciseSearchOptions([
        [{ id: "1", name: "Bench Press" }],
        [
          { id: "1", name: "Bench Press" },
          { id: "2", name: "Incline Bench Press" },
        ],
      ]),
    ).toEqual([
      { id: "1", name: "Bench Press" },
      { id: "2", name: "Incline Bench Press" },
    ]);
  });
});

describe("isAutoResolvable", () => {
  it("auto-picks when the top score is strong and clearly ahead", () => {
    expect(
      isAutoResolvable([
        { score: 0.9 },
        { score: 0.82 },
      ]),
    ).toBe(true);
  });

  it("does not auto-pick when scores are too close", () => {
    expect(
      isAutoResolvable([
        { score: 0.9 },
        { score: 0.88 },
      ]),
    ).toBe(false);
  });

  it("does not auto-pick when the top score is below threshold", () => {
    expect(isAutoResolvable([{ score: 0.8 }])).toBe(false);
  });
});
