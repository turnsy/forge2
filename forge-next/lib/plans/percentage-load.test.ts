import { describe, expect, it } from "vitest";
import {
  disablePercentageLoad,
  enablePercentageLoad,
  getLoadTargetValue,
  updateLoadUnit,
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
        value: 75,
        unit: "kg",
      }),
    ).toBe("75");
  });

  it("toggles between absolute and percentage loads", () => {
    const absolute = { type: "absolute" as const, value: 60, unit: "kg" as const };

    const enabled = enablePercentageLoad(absolute);
    expect(enabled).toEqual({
      type: "percentage",
      value: 60,
      unit: "kg",
    });

    expect(disablePercentageLoad(enabled)).toEqual({
      type: "absolute",
      value: 60,
      unit: "kg",
    });
  });

  it("updates percentage values without dropping unit", () => {
    expect(
      updateLoadTargetValue(
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
      updateLoadUnit(
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
      updateLoadUnit(
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
