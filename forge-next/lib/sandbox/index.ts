/**
 * Vercel Sandbox executor for plan codegen runs.
 * Phase 3: stub when integration is off; Phase 4: real VM.
 *
 * @see docs/plan-generation/phases/phase-4-sandbox.md
 */

import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { isSandboxIntegrationEnabled } from "@/lib/env/plan-generation";
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
    throw new Error(
      "Real sandbox execution is not implemented yet (Phase 4). Unset RUN_SANDBOX_INTEGRATION or implement runPlanSandboxLive.",
    );
  }

  return runPlanSandboxStub(input);
}
