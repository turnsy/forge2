import { describe, expect, it } from "vitest";
import { normalize_v1 } from "./normalize";

describe("normalize_v1", () => {
  it("normalizes case, parentheticals, punctuation, and whitespace", () => {
    expect(normalize_v1("  Back Squat (high-bar)!!! ")).toBe("back squat");
    expect(normalize_v1("Bench  Press 75%")).toBe("bench press 75%");
  });
});
