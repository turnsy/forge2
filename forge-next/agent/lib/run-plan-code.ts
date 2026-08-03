import { loadWorkoutPlan } from "@/lib/plans/validate";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import type { SubmitPlanCodeFailure } from "@/lib/chat/adapters/plan/forge-tool-outputs";
import {
  CURRENT_PLAN_PATH,
  EMPTY_PLAN_SEED,
  OUTPUT_PLAN_PATH,
  RUN_SCRIPT_PATH,
} from "./config";

export type PlanCodeSandbox = {
  writeTextFile(input: { path: string; content: string }): Promise<void>;
  run(input: { command: string }): Promise<{
    exitCode: number;
    stdout?: string;
    stderr?: string;
  }>;
  readTextFile(input: { path: string }): Promise<string | null>;
};

export type RunPlanCodeInSandboxInput = {
  sandbox: PlanCodeSandbox;
  seed: WorkoutPlan | null | undefined;
  python: string;
};

export type RunPlanCodeInSandboxResult =
  | SubmitPlanCodeFailure
  | { ok: true; plan: WorkoutPlan };

export async function runPlanCodeInSandbox({
  sandbox,
  seed,
  python,
}: RunPlanCodeInSandboxInput): Promise<RunPlanCodeInSandboxResult> {
  await sandbox.writeTextFile({
    path: CURRENT_PLAN_PATH,
    content: JSON.stringify(seed ?? EMPTY_PLAN_SEED),
  });
  await sandbox.writeTextFile({ path: RUN_SCRIPT_PATH, content: python });
  await sandbox.run({ command: "mkdir -p output" });

  const result = await sandbox.run({ command: "python3 run.py" });
  if (result.exitCode !== 0) {
    const detail = [result.stderr?.trim(), result.stdout?.trim()]
      .filter(Boolean)
      .join("\n");
    return {
      ok: false as const,
      errors: [
        {
          code: "SANDBOX_FAILED",
          message: detail || "Sandbox execution failed.",
        },
      ],
    };
  }

  let rawOutput: string | null;
  try {
    rawOutput = await sandbox.readTextFile({ path: OUTPUT_PLAN_PATH });
  } catch {
    return {
      ok: false as const,
      errors: [
        {
          code: "MISSING_OUTPUT",
          message: "Sandbox did not produce output/plan.json.",
        },
      ],
    };
  }

  if (!rawOutput) {
    return {
      ok: false as const,
      errors: [
        {
          code: "MISSING_OUTPUT",
          message: "Sandbox did not produce output/plan.json.",
        },
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    return {
      ok: false as const,
      errors: [
        {
          code: "INVALID_JSON",
          message: "output/plan.json was not valid JSON.",
        },
      ],
    };
  }

  const validated = loadWorkoutPlan(parsed);
  if (!validated.ok) {
    return { ok: false as const, errors: validated.errors };
  }

  return { ok: true as const, plan: validated.plan };
}
