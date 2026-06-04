import { describe, expect, it } from "vitest";
import { isSandboxAuthConfigured, isSandboxIntegrationEnabled } from "@/lib/env/plan-generation";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import { runPlanSandbox } from "@/lib/sandbox";
import {
  CURRENT_PLAN_PATH,
  OUTPUT_PLAN_PATH,
  RUN_SCRIPT_PATH,
} from "@/lib/sandbox/constants";

const EXAMPLE_RUN_PY = `
from forge_plan import Plan

plan = Plan.from_json_file("current_plan.json")
if plan.is_empty():
    plan = Plan.empty("Integration Plan")
plan.add_week(index=1, label="Week 1")
plan.add_day(week_index=1, index=1, code="w1d1", name="Lower")
plan.add_exercise(week_index=1, day_index=1, name="Back Squat")
plan.add_set(1, 1, 0, reps=5, load_value=100, unit="kg")
plan.write_json("output/plan.json")
`.trim();

const integrationEnabled =
  isSandboxIntegrationEnabled() && isSandboxAuthConfigured();

describe.runIf(integrationEnabled)("runPlanSandbox integration", () => {
  it("executes forge_plan in a real Vercel Sandbox", async () => {
    const result = await runPlanSandbox({
      currentPlan: null,
      generatedPython: EXAMPLE_RUN_PY,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const validated = loadWorkoutPlan(result.plan);
      expect(validated.ok).toBe(true);
      if (validated.ok) {
        expect(validated.plan.name).toBe("Integration Plan");
      }
    }
  }, 120_000);

  it("iterates an existing seed plan", async () => {
    const seedResult = await runPlanSandbox({
      currentPlan: null,
      generatedPython: EXAMPLE_RUN_PY,
    });
    expect(seedResult.ok).toBe(true);
    if (!seedResult.ok) {
      return;
    }

    const iteratePy = `
from forge_plan import Plan

plan = Plan.from_json_file("current_plan.json")
plan.add_week(index=2, label="Week 2")
plan.add_day(week_index=2, index=1, code="w2d1")
plan.write_json("output/plan.json")
`.trim();

    const result = await runPlanSandbox({
      currentPlan: seedResult.plan,
      generatedPython: iteratePy,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.weeks?.length).toBeGreaterThanOrEqual(2);
    }
  }, 180_000);
});

describe("runPlanSandbox integration guard", () => {
  it("documents required env for live sandbox tests", () => {
    if (!isSandboxIntegrationEnabled()) {
      expect(process.env.RUN_SANDBOX_INTEGRATION).not.toBe("1");
      return;
    }
    expect([CURRENT_PLAN_PATH, RUN_SCRIPT_PATH, OUTPUT_PLAN_PATH].every(Boolean)).toBe(
      true,
    );
  });
});
