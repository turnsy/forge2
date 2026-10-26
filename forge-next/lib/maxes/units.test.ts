import { describe, expect, it } from "vitest";
import { normalizeWeightUnit } from "@/lib/maxes/units";

describe("max unit validation", () => {
  it("accepts kg and lb", () => {
    expect(normalizeWeightUnit(" Kg ")).toBe("kg");
    expect(normalizeWeightUnit("lb")).toBe("lb");
  });

  it("rejects unsupported units", () => {
    expect(normalizeWeightUnit("stone")).toBeNull();
  });
});
