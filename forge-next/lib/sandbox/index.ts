/**
 * Vercel Sandbox executor for structured artifacts.
 * Production uses the real VM; tests use {@link runSandboxStub}.
 *
 * @see docs/plan-generation/phases/phase-4-sandbox.md
 */

import { runPlanSandbox } from "@/lib/sandbox/run-plan";
import { runPlanSandboxStub } from "@/lib/sandbox/stub";
import type { RunPlanSandboxInput, RunSandboxResult, SandboxArtifact } from "@/lib/sandbox/types";

export type {
  RunPlanSandboxInput,
  RunSandboxResult,
  SandboxArtifact,
  SandboxPlanArtifact,
} from "@/lib/sandbox/types";

export { runPlanSandbox } from "@/lib/sandbox/run-plan";
export { runPlanSandboxStub, buildMinimalWorkoutPlan } from "@/lib/sandbox/stub";

export type RunSandboxDeps = {
  /** Override plan executor (defaults to Vercel Sandbox VM). */
  executePlan?: typeof runPlanSandbox;
};

function unknownArtifactError(artifact: SandboxArtifact): RunSandboxResult {
  const unknownType = (artifact as { type: string }).type;
  return {
    ok: false,
    code: "SANDBOX_FAILED",
    message: `Unknown sandbox artifact type: ${unknownType}`,
  };
}

async function executePlanArtifact(
  artifact: Extract<SandboxArtifact, { type: "plan" }>,
  executePlan: (input: RunPlanSandboxInput) => Promise<RunSandboxResult>,
): Promise<RunSandboxResult> {
  return executePlan({
    currentPlan: artifact.currentPlan,
    generatedPython: artifact.generatedPython,
  });
}

/**
 * Run codegen for a sandbox artifact. Defaults to the live Vercel Sandbox VM.
 */
export async function runSandbox(
  input: { artifact: SandboxArtifact },
  deps: RunSandboxDeps = {},
): Promise<RunSandboxResult> {
  switch (input.artifact.type) {
    case "plan": {
      const execute = deps.executePlan ?? runPlanSandbox;
      return executePlanArtifact(input.artifact, execute);
    }
    default:
      return unknownArtifactError(input.artifact);
  }
}

/**
 * Stub sandbox for unit tests and CI (no Vercel credentials).
 */
export async function runSandboxStub(input: {
  artifact: SandboxArtifact;
}): Promise<RunSandboxResult> {
  switch (input.artifact.type) {
    case "plan":
      return executePlanArtifact(input.artifact, runPlanSandboxStub);
    default:
      return unknownArtifactError(input.artifact);
  }
}
