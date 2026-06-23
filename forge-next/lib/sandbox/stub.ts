import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import type { RunPlanSandboxInput, RunSandboxResult } from "@/lib/sandbox/types";

/** Minimal valid plan for stub sandbox runs (unit tests / CI only). */
export function buildMinimalWorkoutPlan(name = "Generated Plan"): WorkoutPlan {
  return {
    ...structuredClone(minimalWorkoutPlan),
    name,
  };
}

/**
 * Stub executor for unit tests and CI — returns current plan or a minimal valid plan.
 * Production plan-chat uses real Vercel Sandbox via `runPlanSandbox`.
 */
export async function runPlanSandboxStub(
  input: RunPlanSandboxInput,
): Promise<RunSandboxResult> {
  if (input.currentPlan) {
    return { ok: true, plan: input.currentPlan };
  }

  void input.generatedPython;
  return { ok: true, plan: buildMinimalWorkoutPlan() };
}
