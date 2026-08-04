import { describe, expect, it } from "vitest";
import { estimateOneRepMax, highestRepSegment } from "./estimate-one-rep-max";

describe("one rep max estimates", () => {
  it("uses the highest combined-rep segment", () => {
    expect(highestRepSegment("3+1")).toBe(3);
    expect(highestRepSegment("2+3")).toBe(3);
  });

  it("uses the Epley formula", () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.6667);
  });
});
