/**
 * Vercel Sandbox executor for plan codegen runs.
 * Implementation: Phase 4.
 *
 * @see docs/plan-generation/phases/phase-4-sandbox.md
 */

import type { WorkoutPlan } from "@/lib/plans/workout-plan";

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
  _input: RunPlanSandboxInput,
): Promise<RunPlanSandboxResult> {
  throw new Error("runPlanSandbox is not implemented (Phase 4)");
}
