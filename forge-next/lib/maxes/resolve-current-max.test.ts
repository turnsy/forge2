import { describe, expect, it } from "vitest";
import { resolveBestMax, resolveCurrentMax } from "./resolve-current-max";

describe("resolveCurrentMax", () => {
  it("chooses the most recent entry so manual corrections can lower the effective max", () => {
    const result = resolveCurrentMax([
      { value: 110, unit: "kg", source: "tested", loggedAt: "2026-01-01" },
      { value: 100, unit: "kg", source: "coach_entered", loggedAt: "2026-02-01" },
    ]);
    expect(result?.value).toBe(100);
  });

  it("returns null when no usable rows exist", () => {
    expect(resolveCurrentMax([])).toBeNull();
  });
});

describe("resolveBestMax", () => {
  it("chooses the highest value regardless of recency", () => {
    const result = resolveBestMax([
      { value: 100, unit: "kg", source: "tested", loggedAt: "2026-02-01" },
      { value: 110, unit: "kg", source: "estimated_from_log", loggedAt: "2026-01-01" },
    ]);
    expect(result?.value).toBe(110);
  });

  it("compares values across compatible units", () => {
    const result = resolveBestMax([
      { value: 100, unit: "kg", loggedAt: "2026-01-01" },
      { value: 230, unit: "lb", loggedAt: "2026-02-01" },
    ]);
    expect(result?.value).toBe(230);
    expect(result?.unit).toBe("lb");
  });
});
