import { describe, expect, it } from "vitest";
import { makeWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import { loadWorkoutPlan } from "@/lib/plans/validate";

function minimalValidPlan() {
  return makeWorkoutPlan({ name: "Test Plan" });
}

describe("loadWorkoutPlan", () => {
  it("accepts a minimal valid plan", () => {
    const result = loadWorkoutPlan(minimalValidPlan());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.name).toBe("Test Plan");
    }
  });

  it("rejects missing required fields", () => {
    const result = loadWorkoutPlan({ schemaVersion: "3.0.0" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((error) => error.message.includes("required"))).toBe(
        true,
      );
    }
  });

  it("rejects wrong schemaVersion", () => {
    const result = loadWorkoutPlan({
      ...minimalValidPlan(),
      schemaVersion: "1.0.0",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.path.includes("schemaVersion"))).toBe(
        true,
      );
    }
  });

  it("rejects invalid day code pattern", () => {
    const plan = minimalValidPlan();
    plan.weeks[0].days[0].code = "invalid";

    const result = loadWorkoutPlan(plan);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((error) => error.path.includes("code"))).toBe(true);
    }
  });
});
