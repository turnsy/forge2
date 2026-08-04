import { describe, expect, it } from "vitest";
import { createEmptyWorkoutPlan } from "@/lib/plans/plan-defaults";

describe("createEmptyWorkoutPlan", () => {
  it("returns a draft plan with one unnamed default exercise", () => {
    const plan = createEmptyWorkoutPlan();

    expect(plan.name).toBe("New Plan");
    expect(plan.weeks).toHaveLength(1);
    expect(plan.weeks[0]?.days).toHaveLength(1);
    expect(plan.weeks[0]?.days[0]?.blocks).toHaveLength(1);
    expect(plan.weeks[0]?.days[0]?.blocks[0]?.exercises).toHaveLength(1);
    expect(plan.weeks[0]?.days[0]?.blocks[0]?.exercises[0]?.name).toBe("");
  });

  it("accepts a custom plan name", () => {
    const plan = createEmptyWorkoutPlan("Custom Block");

    expect(plan.name).toBe("Custom Block");
  });
});
