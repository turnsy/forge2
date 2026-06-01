import { describe, expect, it } from "vitest";
import {
  formatLoad,
  formatPercentageLoad,
  formatReps,
  formatTargetInstruction,
  getDayTitle,
  getWeekTitle,
} from "@/lib/plans/display";

describe("formatReps", () => {
  it("formats integer reps", () => {
    expect(formatReps(5)).toBe("5");
  });

  it("formats combined reps", () => {
    expect(formatReps("3+1")).toBe("3+1");
  });
});

describe("formatLoad", () => {
  it("formats absolute load", () => {
    expect(formatLoad({ type: "absolute", value: 100, unit: "kg" })).toBe("100 kg");
  });

  it("formats exact percentage load", () => {
    expect(
      formatPercentageLoad({
        type: "percentage",
        unit: "%",
        basis: "snatch_1rm",
        operator: "exact",
        value: 70,
      }),
    ).toBe("70%");
  });

  it("formats range percentage load", () => {
    expect(
      formatPercentageLoad({
        type: "percentage",
        unit: "%",
        basis: "clean_1rm",
        operator: "range",
        minValue: 70,
        maxValue: 80,
      }),
    ).toBe("70–80%");
  });

  it("formats at-least percentage load", () => {
    expect(
      formatPercentageLoad({
        type: "percentage",
        unit: "%",
        basis: "back_squat_1rm",
        operator: "at-least",
        value: 80,
      }),
    ).toBe("≥80%");
  });
});

describe("formatTargetInstruction", () => {
  it("returns instruction as-is", () => {
    expect(formatTargetInstruction("work up to")).toBe("work up to");
  });
});

describe("getWeekTitle", () => {
  it("prefers label over name and index", () => {
    expect(getWeekTitle({ index: 1, label: "Week 1", name: "Intro", days: [] as never })).toBe(
      "Week 1",
    );
  });

  it("falls back to Week index", () => {
    expect(getWeekTitle({ index: 2, days: [] as never })).toBe("Week 2");
  });
});

describe("getDayTitle", () => {
  it("returns Day with index", () => {
    expect(getDayTitle({ index: 1, code: "w1d1", exercises: [] as never })).toBe("Day 1");
    expect(getDayTitle({ index: 3, code: "w2d3", name: "Heavy day", exercises: [] as never })).toBe(
      "Day 3",
    );
  });
});
