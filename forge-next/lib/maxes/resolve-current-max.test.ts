import { describe, expect, it } from "vitest";
import { resolveCurrentMax } from "./resolve-current-max";

describe("resolveCurrentMax", () => {
  it("chooses the most recent row regardless of source", () => {
    const result = resolveCurrentMax([
      { value: 100, unit: "kg", source: "tested", loggedAt: "2026-01-01" },
      { value: 110, unit: "kg", source: "estimated_from_log", loggedAt: "2026-02-01" },
    ]);
    expect(result?.value).toBe(110);
  });

  it("returns null when no usable rows exist", () => {
    expect(resolveCurrentMax([])).toBeNull();
  });
});
