import { describe, expect, it } from "vitest";
import { resolveCurrentMax } from "./resolve-current-max";

describe("resolveCurrentMax", () => {
  it("chooses the most recent entry so manual corrections can lower the effective max", () => {
    const result = resolveCurrentMax([
      { value: 110, unit: "kg", source: "tested", loggedAt: "2026-01-01" },
      {
        value: 100,
        unit: "kg",
        source: "coach_entered",
        loggedAt: "2026-02-01",
      },
    ]);
    expect(result?.value).toBe(100);
  });

  it("returns null when no usable rows exist", () => {
    expect(resolveCurrentMax([])).toBeNull();
  });
});

describe("training max history", () => {
  it("excludes invalidated singles and legacy estimates", () => {
    expect(
      resolveCurrentMax([
        { value: 100, unit: "kg", loggedAt: "2026-01-01" },
        {
          value: 150,
          unit: "kg",
          loggedAt: "2026-02-01",
          voidedAt: "2026-02-02",
        },
        {
          value: 160,
          unit: "kg",
          loggedAt: "2026-03-01",
          source: "estimated_from_log",
        },
      ])?.value,
    ).toBe(100);
  });
  it("breaks timestamp ties by database entry order", () => {
    expect(
      resolveCurrentMax([
        { value: 150, unit: "kg", loggedAt: "2026-01-01", entryOrder: 1 },
        { value: 100, unit: "kg", loggedAt: "2026-01-01", entryOrder: 2 },
      ])?.value,
    ).toBe(100);
  });
});
