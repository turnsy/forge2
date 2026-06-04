/**
 * Vercel Sandbox executor for plan codegen runs.
 * Uses a stub in unit tests; live VM when RUN_SANDBOX_INTEGRATION=1.
 *
 * @see docs/plan-generation/phases/phase-4-sandbox.md
 */

import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { isSandboxIntegrationEnabled } from "@/lib/env/plan-generation";
import { runPlanSandboxLive } from "@/lib/sandbox/live";
import { runPlanSandboxStub } from "@/lib/sandbox/stub";

export type RunPlanSandboxInput = {
  currentPlan: WorkoutPlan | null;
  generatedPython: string;
};

export type RunPlanSandboxResult =
  | { ok: true; plan: WorkoutPlan }
  | {
      ok: false;
      code: "SANDBOX_TIMEOUT" | "SANDBOX_FAILED" | "MISSING_OUTPUT";
      message: string;
    };

export async function runPlanSandbox(
  input: RunPlanSandboxInput,
): Promise<RunPlanSandboxResult> {
  if (isSandboxIntegrationEnabled()) {
    return runPlanSandboxLive(input);
  }

  return runPlanSandboxStub(input);
}
