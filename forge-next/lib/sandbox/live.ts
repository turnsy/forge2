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
import type { RunPlanSandboxInput, RunPlanSandboxResult } from "@/lib/sandbox/index";

const EMPTY_SEED = {
  schemaVersion: "2.0.0",
  name: "",
  weeks: [],
} as const;

export type SandboxLike = {
  writeFiles: (
    files: { path: string; content: string | Uint8Array }[],
    opts?: { signal?: AbortSignal },
  ) => Promise<void>;
  mkDir: (path: string, opts?: { signal?: AbortSignal }) => Promise<void>;
  runCommand: (
    command: string,
    args?: string[],
    opts?: { signal?: AbortSignal; timeoutMs?: number },
  ) => Promise<{
    exitCode: number;
    stdout: (opts?: { signal?: AbortSignal }) => Promise<string>;
    stderr: (opts?: { signal?: AbortSignal }) => Promise<string>;
  }>;
  readFileToBuffer: (
    file: { path: string; cwd?: string },
    opts?: { signal?: AbortSignal },
  ) => Promise<Buffer | null>;
  stop: (opts?: { signal?: AbortSignal }) => Promise<unknown>;
};

export type RunPlanSandboxLiveDeps = {
  createSandbox?: (params?: {
    runtime?: string;
    timeout?: number;
    persistent?: boolean;
    networkPolicy?: "deny-all";
  }) => Promise<SandboxLike>;
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

export async function runPlanSandboxLive(
  input: RunPlanSandboxInput,
  deps: RunPlanSandboxLiveDeps = {},
): Promise<RunPlanSandboxResult> {
  const createSandbox =
    deps.createSandbox ??
    (async (params) =>
      Sandbox.create({
        runtime: params?.runtime ?? SANDBOX_RUNTIME,
        timeout: params?.timeout ?? SANDBOX_LIFETIME_MS,
        persistent: params?.persistent ?? false,
        networkPolicy: params?.networkPolicy ?? "deny-all",
      }));

  let sandbox: SandboxLike | null = null;

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
