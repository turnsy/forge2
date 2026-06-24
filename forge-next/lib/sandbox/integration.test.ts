import { describe, expect, it } from "vitest";
import { isSandboxAuthConfigured, isSandboxIntegrationEnabled } from "@/lib/env/plan-generation";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import { runSandbox } from "@/lib/sandbox";
import {
  CURRENT_PLAN_PATH,
  OUTPUT_PLAN_PATH,
  RUN_SCRIPT_PATH,
} from "@/lib/sandbox/constants";

const EXAMPLE_RUN_PY = `
from forge_plan import Day, Exercise, Plan, Week

plan = Plan.from_json_file("current_plan.json")
if plan.is_empty():
    plan = Plan("Integration Plan").add_week(
        Week(label="Week 1").add_day(
            Day(name="Lower").add_exercise(
                Exercise("Back Squat").add_set(reps=5, target=100, unit="kg")
            )
        )
    )
plan.write_json("output/plan.json")
`.trim();

const integrationEnabled =
  isSandboxIntegrationEnabled() && isSandboxAuthConfigured();

describe.runIf(integrationEnabled)("runSandbox integration", () => {
  it("executes forge_plan in a real Vercel Sandbox", async () => {
    const result = await runSandbox({
      artifact: {
        type: "plan",
        currentPlan: null,
        generatedPython: EXAMPLE_RUN_PY,
      },
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
    const seedResult = await runSandbox({
      artifact: {
        type: "plan",
        currentPlan: null,
        generatedPython: EXAMPLE_RUN_PY,
      },
    });
    expect(seedResult.ok).toBe(true);
    if (!seedResult.ok) {
      return;
    }

    const iteratePy = `
from forge_plan import Day, Exercise, Plan, Week

plan = Plan.from_json_file("current_plan.json")
plan.add_week(
    Week(label="Week 2").add_day(
        Day().add_exercise(
            Exercise("Front Squat").add_set(reps=5, target=80, unit="kg")
        )
    )
)
plan.write_json("output/plan.json")
`.trim();

    const result = await runSandbox({
      artifact: {
        type: "plan",
        currentPlan: seedResult.plan,
        generatedPython: iteratePy,
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.weeks?.length).toBeGreaterThanOrEqual(2);
    }
  }, 180_000);
});

describe("runSandbox integration guard", () => {
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
