import { Sandbox } from "@vercel/sandbox";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { bundleForgePlanFiles } from "@/lib/sandbox/bundle-forge-plan";
import {
  CURRENT_PLAN_PATH,
  OUTPUT_PLAN_PATH,
  RUN_SCRIPT_PATH,
  SANDBOX_COMMAND_TIMEOUT_MS,
  SANDBOX_LIFETIME_MS,
  SANDBOX_RUNTIME,
  SANDBOX_WORKDIR,
} from "@/lib/sandbox/constants";
import type { RunPlanSandboxInput, RunSandboxResult } from "@/lib/sandbox/types";

const EMPTY_SEED = {
  schemaVersion: "2.0.0",
  name: "",
  weeks: [],
} as const;

export type RunPlanSandboxDeps = {
  createSandbox?: typeof Sandbox.create;
};

function buildCurrentPlanSeed(currentPlan: WorkoutPlan | null): string {
  if (currentPlan) {
    return JSON.stringify(currentPlan);
  }
  return JSON.stringify(EMPTY_SEED);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/**
 * Execute plan codegen in a real Vercel Sandbox (python3.13).
 * Production plan-chat always uses this path.
 */
export async function runPlanSandbox(
  input: RunPlanSandboxInput,
  deps: RunPlanSandboxDeps = {},
): Promise<RunSandboxResult> {
  const createSandbox = deps.createSandbox ?? Sandbox.create;

  let sandbox: Sandbox | null = null;

  try {
    sandbox = await createSandbox({
      runtime: SANDBOX_RUNTIME,
      timeout: SANDBOX_LIFETIME_MS,
      persistent: false,
      networkPolicy: "deny-all",
    });

    const libraryFiles = bundleForgePlanFiles();
    await sandbox.writeFiles([
      {
        path: CURRENT_PLAN_PATH,
        content: buildCurrentPlanSeed(input.currentPlan),
      },
      { path: RUN_SCRIPT_PATH, content: input.generatedPython },
      ...libraryFiles.map((file) => ({
        path: file.path,
        content: file.content,
      })),
    ]);

    await sandbox.mkDir("output");

    const command = await sandbox.runCommand("python3", [RUN_SCRIPT_PATH], {
      timeoutMs: SANDBOX_COMMAND_TIMEOUT_MS,
    });

    if (command.exitCode !== 0) {
      const stderr = await command.stderr().catch(() => "");
      const stdout = await command.stdout().catch(() => "");
      const detail = [stderr.trim(), stdout.trim()].filter(Boolean).join("\n");
      return {
        ok: false,
        code: "SANDBOX_FAILED",
        message: detail || `python3 ${RUN_SCRIPT_PATH} exited with ${command.exitCode}`,
      };
    }

    const outputBuffer = await sandbox.readFileToBuffer({
      path: OUTPUT_PLAN_PATH,
      cwd: SANDBOX_WORKDIR,
    });

    if (!outputBuffer) {
      return {
        ok: false,
        code: "MISSING_OUTPUT",
        message: `${OUTPUT_PLAN_PATH} was not produced by run.py`,
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(outputBuffer.toString("utf8"));
    } catch {
      return {
        ok: false,
        code: "SANDBOX_FAILED",
        message: `${OUTPUT_PLAN_PATH} is not valid JSON`,
      };
    }

    return { ok: true, plan: parsed as WorkoutPlan };
  } catch (error) {
    if (isAbortError(error)) {
      return {
        ok: false,
        code: "SANDBOX_TIMEOUT",
        message: `Sandbox command timed out after ${SANDBOX_COMMAND_TIMEOUT_MS}ms`,
      };
    }

    const message = error instanceof Error ? error.message : "Sandbox execution failed";
    if (/timed?\s*out/i.test(message)) {
      return { ok: false, code: "SANDBOX_TIMEOUT", message };
    }

    return { ok: false, code: "SANDBOX_FAILED", message };
  } finally {
    if (sandbox) {
      try {
        await sandbox.stop();
      } catch {
        // Best-effort teardown
      }
    }
  }
}
