import { describe, expect, it } from "vitest";
import { isAutoResolvable } from "./search";

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
