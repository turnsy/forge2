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

  it("formats percentage load with unit", () => {
    expect(
      formatPercentageLoad({
        type: "percentage",
        value: 70,
        unit: "kg",
      }),
    ).toBe("70% (kg)");
  });
});

describe("formatTargetInstruction", () => {
  it("returns instruction as-is", () => {
    expect(formatTargetInstruction("work up to")).toBe("work up to");
  });
});

describe("getWeekTitle", () => {
  it("prefers label over name and index", () => {
    expect(
      getWeekTitle({ label: "Week 1", name: "Intro", days: [] as never }, 0),
    ).toBe("Week 1");
  });

  it("falls back to Week index", () => {
    expect(getWeekTitle({ days: [] as never }, 1)).toBe("Week 2");
  });
});

describe("getDayTitle", () => {
  it("returns Day with index", () => {
    expect(getDayTitle({ code: "w1d1", blocks: [] as never }, 0)).toBe("Day 1");
    expect(getDayTitle({ code: "w2d3", name: "Heavy day", blocks: [] as never }, 2)).toBe(
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
            value: 80,
            unit: "kg",
          },
        },
        { load: { type: "absolute", value: 102, unit: "kg" } },
      ),
    ).toBe(true);
  });
});
