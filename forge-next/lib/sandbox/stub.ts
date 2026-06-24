import { buildMinimalWorkoutPlan } from "@/lib/plans/minimal-plan";
import type { RunPlanSandboxInput, RunSandboxResult } from "@/lib/sandbox/types";

export { buildMinimalWorkoutPlan };

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
