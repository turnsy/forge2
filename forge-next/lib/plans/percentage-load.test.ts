import { describe, expect, it } from "vitest";
import {
  coerceToExactPercentageLoad,
  disablePercentageLoad,
  enablePercentageLoad,
  getLoadTargetValue,
  updateAbsoluteLoadUnit,
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
        absoluteUnit: "kg",
      }),
    ).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 70,
      absoluteUnit: "kg",
    });
  });

  it("toggles between absolute and exact percentage loads", () => {
    const absolute = { type: "absolute" as const, value: 60, unit: "kg" as const };

    const enabled = enablePercentageLoad(absolute);
    expect(enabled).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 60,
      absoluteUnit: "kg",
    });

    expect(disablePercentageLoad(enabled)).toEqual({
      type: "absolute",
      value: 60,
      unit: "kg",
    });
  });

  it("updates percentage values without dropping absoluteUnit", () => {
    expect(
      updateLoadTargetValue(
        {
          type: "percentage",
          unit: "%",
          operator: "exact",
          value: 75,
          absoluteUnit: "kg",
        },
        "80",
      ),
    ).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 80,
      absoluteUnit: "kg",
    });
  });

  it("persists absoluteUnit on percentage loads", () => {
    expect(
      updateAbsoluteLoadUnit(
        {
          type: "percentage",
          unit: "%",
          operator: "exact",
          value: 75,
        },
        "kg",
      ),
    ).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 75,
      absoluteUnit: "kg",
    });
  });
});
