import { describe, expect, it } from "vitest";
import {
  createDefaultPercentageLoad,
  normalizePercentageLoad,
  switchLoadKind,
  updatePercentageBasis,
  updatePercentageOperator,
  updatePercentageScalar,
} from "@/lib/plans/percentage-load";

describe("percentage-load", () => {
  it("creates a default exact percentage load", () => {
    expect(createDefaultPercentageLoad()).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 75,
    });
  });

  it("switches absolute load to percentage using the current value as a seed", () => {
    expect(
      switchLoadKind({ type: "absolute", value: 60, unit: "kg" }, "percentage"),
    ).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 60,
    });
  });

  it("switches percentage load to absolute using the scalar value", () => {
    expect(
      switchLoadKind(
        {
          type: "percentage",
          unit: "%",
          operator: "exact",
          value: 80,
          basis: "back_squat_1rm",
        },
        "absolute",
      ),
    ).toEqual({
      type: "absolute",
      value: 80,
      unit: "lb",
    });
  });

  it("uses minValue when switching a range percentage load to absolute", () => {
    expect(
      switchLoadKind(
        {
          type: "percentage",
          unit: "%",
          operator: "range",
          minValue: 70,
          maxValue: 80,
        },
        "absolute",
      ),
    ).toEqual({
      type: "absolute",
      value: 70,
      unit: "lb",
    });
  });

  it("migrates scalar percentage loads to range values", () => {
    expect(
      updatePercentageOperator(
        {
          type: "percentage",
          unit: "%",
          operator: "exact",
          value: 72,
        },
        "range",
      ),
    ).toEqual({
      type: "percentage",
      unit: "%",
      operator: "range",
      minValue: 72,
      maxValue: 77,
    });
  });

  it("migrates range percentage loads back to exact values", () => {
    expect(
      updatePercentageOperator(
        {
          type: "percentage",
          unit: "%",
          operator: "range",
          minValue: 70,
          maxValue: 80,
        },
        "exact",
      ),
    ).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 70,
    });
  });

  it("updates range min and max independently", () => {
    const load = {
      type: "percentage" as const,
      unit: "%" as const,
      operator: "range" as const,
      minValue: 70,
      maxValue: 80,
    };

    expect(updatePercentageScalar(load, "minValue", "65")).toEqual({
      type: "percentage",
      unit: "%",
      operator: "range",
      minValue: 65,
      maxValue: 80,
    });

    expect(updatePercentageScalar(load, "maxValue", "85")).toEqual({
      type: "percentage",
      unit: "%",
      operator: "range",
      minValue: 70,
      maxValue: 85,
    });
  });

  it("normalizes basis to undefined when cleared", () => {
    expect(
      updatePercentageBasis(
        {
          type: "percentage",
          unit: "%",
          operator: "exact",
          value: 75,
          basis: "snatch_1rm",
        },
        "",
      ),
    ).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 75,
    });
  });

  it("keeps basis when provided", () => {
    expect(
      normalizePercentageLoad(
        updatePercentageBasis(createDefaultPercentageLoad(), "back_squat_1rm"),
      ),
    ).toEqual({
      type: "percentage",
      unit: "%",
      operator: "exact",
      value: 75,
      basis: "back_squat_1rm",
    });
  });
});
