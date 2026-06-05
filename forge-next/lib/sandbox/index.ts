/**
 * Vercel Sandbox executor for structured artifacts.
 * Production uses the real VM; tests use {@link runSandboxStub}.
 *
 * @see docs/plan-generation/phases/phase-4-sandbox.md
 */

import { runPlanSandbox } from "@/lib/sandbox/run-plan";
import { runPlanSandboxStub } from "@/lib/sandbox/stub";
import type { RunSandboxResult, SandboxArtifact } from "@/lib/sandbox/types";

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
      return execute({
        currentPlan: input.artifact.currentPlan,
        generatedPython: input.artifact.generatedPython,
      });
    }
    default: {
      const unknownType = (input.artifact as { type: string }).type;
      return {
        ok: false,
        code: "SANDBOX_FAILED",
        message: `Unknown sandbox artifact type: ${unknownType}`,
      };
    }
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
      return runPlanSandboxStub({
        currentPlan: input.artifact.currentPlan,
        generatedPython: input.artifact.generatedPython,
      });
    default: {
      const unknownType = (input.artifact as { type: string }).type;
      return {
        ok: false,
        code: "SANDBOX_FAILED",
        message: `Unknown sandbox artifact type: ${unknownType}`,
      };
    }
  }
}
