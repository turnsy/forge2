import { describe, expect, it } from "vitest";
import {
  disablePercentageTarget,
  enablePercentageTarget,
  getTargetValue,
  updateTargetUnit,
  updateTargetValue,
} from "@/lib/plans/percentage-load";

describe("percentage-load", () => {
  it("reads scalar values from absolute and percentage loads", () => {
    expect(getTargetValue({ type: "absolute", value: 185, unit: "lb" })).toBe(
      "185",
    );
    expect(
      getTargetValue({
        type: "percentage",
        value: 75,
        unit: "kg",
      }),
    ).toBe("75");
  });

  it("toggles between absolute and percentage loads", () => {
    const absolute = { type: "absolute" as const, value: 60, unit: "kg" as const };

    const enabled = enablePercentageTarget(absolute);
    expect(enabled).toEqual({
      type: "percentage",
      value: 60,
      unit: "kg",
    });

    expect(disablePercentageTarget(enabled)).toEqual({
      type: "absolute",
      value: 60,
      unit: "kg",
    });
  });

  it("updates percentage values without dropping unit", () => {
    expect(
      updateTargetValue(
        {
          type: "percentage",
          value: 75,
          unit: "kg",
        },
        "80",
      ),
    ).toEqual({
      type: "percentage",
      value: 80,
      unit: "kg",
    });
  });

  it("updates unit on both load types", () => {
    expect(
      updateTargetUnit(
        {
          type: "percentage",
          value: 75,
          unit: "lb",
        },
        "kg",
      ),
    ).toEqual({
      type: "percentage",
      value: 75,
      unit: "kg",
    });

    expect(
      updateTargetUnit(
        {
          type: "absolute",
          value: 100,
          unit: "lb",
        },
        "kg",
      ),
    ).toEqual({
      type: "absolute",
      value: 100,
      unit: "kg",
    });
  });
});
