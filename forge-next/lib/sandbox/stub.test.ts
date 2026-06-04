import { describe, expect, it } from "vitest";
import { runPlanSandboxStub, buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";
import { loadWorkoutPlan } from "@/lib/plans/validate";

describe("runPlanSandboxStub", () => {
  it("returns a minimal valid plan when seed is empty", async () => {
    const result = await runPlanSandboxStub({
      currentPlan: null,
      generatedPython: "pass",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(loadWorkoutPlan(result.plan).ok).toBe(true);
    }
  });

  it("returns the current plan when provided", async () => {
    const plan = buildMinimalWorkoutPlan("Kept");
    const result = await runPlanSandboxStub({
      currentPlan: plan,
      generatedPython: "pass",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.name).toBe("Kept");
    }
  });
});
