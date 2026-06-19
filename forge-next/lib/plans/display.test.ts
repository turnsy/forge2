import { describe, expect, it } from "vitest";
import {
  actualLoadMatchesPlanned,
  actualRepsMatchesPlanned,
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
      "Heavy day",
    );
  });
});

describe("actualRepsMatchesPlanned", () => {
  it("returns true when exact planned reps match actual", () => {
    expect(
      actualRepsMatchesPlanned(
        { type: "exact", reps: 5, load: { type: "absolute", value: 85, unit: "kg" } },
        { reps: 5 },
      ),
    ).toBe(true);
  });

  it("returns false when exact planned reps differ from actual", () => {
    expect(
      actualRepsMatchesPlanned(
        { type: "exact", reps: 5, load: { type: "absolute", value: 85, unit: "kg" } },
        { reps: 4 },
      ),
    ).toBe(false);
  });

  it("returns null when target set has no prescribed reps", () => {
    expect(
      actualRepsMatchesPlanned(
        { type: "target", instruction: "work up to" },
        { reps: 5 },
      ),
    ).toBeNull();
  });
});

describe("actualLoadMatchesPlanned", () => {
  it("returns true when absolute planned load matches actual", () => {
    expect(
      actualLoadMatchesPlanned(
        { type: "exact", reps: 5, load: { type: "absolute", value: 85, unit: "kg" } },
        { load: { type: "absolute", value: 85, unit: "kg" } },
      ),
    ).toBe(true);
  });

  it("returns false when absolute planned load differs from actual", () => {
    expect(
      actualLoadMatchesPlanned(
        { type: "exact", reps: 5, load: { type: "absolute", value: 85, unit: "kg" } },
        { load: { type: "absolute", value: 102, unit: "kg" } },
      ),
    ).toBe(false);
  });

  it("returns true for percentage-based prescriptions regardless of actual load", () => {
    expect(
      actualLoadMatchesPlanned(
        {
          type: "exact",
          reps: 5,
          load: {
            type: "percentage",
            unit: "%",
            basis: "back_squat_1rm",
            operator: "exact",
            value: 80,
          },
        },
        { load: { type: "absolute", value: 102, unit: "kg" } },
      ),
    ).toBe(true);
  });
});
