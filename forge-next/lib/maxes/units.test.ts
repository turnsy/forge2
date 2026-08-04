import { describe, expect, it } from "vitest";
import { isValidWeightUnit, normalizeWeightUnit } from "@/lib/maxes/units";

describe("max unit validation", () => {
  it("accepts kg and lb", () => {
    expect(isValidWeightUnit("kg")).toBe(true);
    expect(isValidWeightUnit("LB")).toBe(true);
    expect(normalizeWeightUnit(" Kg ")).toBe("kg");
    expect(normalizeWeightUnit("lb")).toBe("lb");
  });

  it("rejects unsupported units", () => {
    expect(isValidWeightUnit("stone")).toBe(false);
    expect(normalizeWeightUnit("stone")).toBeNull();
  });
});
