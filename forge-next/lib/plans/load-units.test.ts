import { describe, expect, it } from "vitest";
import { isPresetLoadUnit, PRESET_LOAD_UNITS } from "@/lib/plans/load-units";

describe("load units", () => {
  it("recognizes preset units", () => {
    for (const unit of PRESET_LOAD_UNITS) {
      expect(isPresetLoadUnit(unit)).toBe(true);
    }
    expect(isPresetLoadUnit("mi")).toBe(false);
  });
});
