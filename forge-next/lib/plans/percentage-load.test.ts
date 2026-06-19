import { describe, expect, it } from "vitest";
import {
  coerceToExactPercentageLoad,
  disablePercentageLoad,
  enablePercentageLoad,
  getLoadTargetValue,
  updateLoadTargetValue,
} from "@/lib/plans/percentage-load";

describe("percentage-load", () => {
  it("reads scalar values from absolute and percentage loads", () => {
    expect(getLoadTargetValue({ type: "absolute", value: 185, unit: "lb" })).toBe(
      "185",
    );
    expect(
      getLoadTargetValue({
        type: "percentage",
        unit: "%",
        operator: "exact",
        value: 75,
      }),
    ).toBe("75");
  });

  it("coerces non-exact percentage loads to exact values", () => {
    expect(
      coerceToExactPercentageLoad({
        type: "percentage",
        unit: "%",
        operator: "range",
        minValue: 70,
        maxValue: 80,
        basis: "back_squat_1rm",
      }),
    ).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 70,
    });
  });

  it("toggles between absolute and exact percentage loads", () => {
    const absolute = { type: "absolute" as const, value: 60, unit: "kg" as const };

    const enabled = enablePercentageLoad(absolute, "lb");
    expect(enabled.load).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 60,
    });
    expect(enabled.rememberedUnit).toBe("kg");

    expect(disablePercentageLoad(enabled.load, enabled.rememberedUnit)).toEqual({
      type: "absolute",
      value: 60,
      unit: "kg",
    });
  });

  it("updates percentage values without basis or operator UI", () => {
    expect(
      updateLoadTargetValue(
        {
          type: "percentage",
          unit: "%",
          operator: "exact",
          value: 75,
        },
        "80",
      ),
    ).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 80,
    });
  });
});
