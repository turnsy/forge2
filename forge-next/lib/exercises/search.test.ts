import { describe, expect, it } from "vitest";
import { mergeExerciseSearchOptions } from "./search";

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
