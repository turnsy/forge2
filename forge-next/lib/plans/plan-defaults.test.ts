import { describe, expect, it } from "vitest";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";
import { loadWorkoutPlan } from "@/lib/plans/validate";

describe("createEmptyWorkoutPlan", () => {
  it("returns a schema-valid plan with one default day", () => {
    const plan = createEmptyWorkoutPlan();

    const result = loadWorkoutPlan(plan);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.plan.name).toBe("New Plan");
    expect(result.plan.weeks).toHaveLength(1);
    expect(result.plan.weeks[0]?.days).toHaveLength(1);
    expect(result.plan.weeks[0]?.days[0]?.exercises).toHaveLength(1);
  });

  it("accepts a custom plan name", () => {
    const plan = createEmptyWorkoutPlan("Custom Block");

    expect(plan.name).toBe("Custom Block");
  });
});
