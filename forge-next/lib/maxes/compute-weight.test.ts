import { describe, expect, it } from "vitest";
import { computePrescribedWeight } from "./compute-weight";

describe("computePrescribedWeight", () => {
  it("converts units and rounds to the standard increment", () => {
    expect(computePrescribedWeight({ value: 100, unit: "kg" }, 75, "lb")).toBe(165);
    expect(computePrescribedWeight({ value: 200, unit: "lb" }, 75, "kg")).toBe(67.5);
  });

  it("returns null for unsupported units or missing maxes", () => {
    expect(computePrescribedWeight(null, 75, "kg")).toBeNull();
    expect(computePrescribedWeight({ value: 100, unit: "stone" }, 75, "kg")).toBeNull();
  });
});
