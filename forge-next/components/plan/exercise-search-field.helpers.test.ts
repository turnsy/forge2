import { describe, expect, it } from "vitest";
import { shouldOfferCustomExerciseEntry } from "@/components/plan/exercise-search-field";

describe("shouldOfferCustomExerciseEntry", () => {
  it("offers custom entry when query does not exactly match a candidate", () => {
    expect(
      shouldOfferCustomExerciseEntry("Close Grip Bench", [
        { id: "1", name: "Bench Press" },
      ]),
    ).toBe(true);
  });

  it("does not offer custom entry for an exact candidate match", () => {
    expect(
      shouldOfferCustomExerciseEntry("Bench Press", [{ id: "1", name: "Bench Press" }]),
    ).toBe(false);
  });
});
