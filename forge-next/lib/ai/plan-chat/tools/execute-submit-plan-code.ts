import { loadWorkoutPlan } from "@/lib/plans/validate";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { runSandbox } from "@/lib/sandbox";

export type SubmitPlanCodeError =
  | { code: string; message: string }
  | { path: string; message: string };

export type SubmitPlanCodeResult =
  | { ok: true; plan: WorkoutPlan }
  | { ok: false; errors: SubmitPlanCodeError[] };

export type ExecuteSubmitPlanCodeInput = {
  python: string;
  currentPlan: WorkoutPlan | null;
  runSandbox?: typeof runSandbox;
  onRunStatus?: (status: "sandbox" | "validating") => void;
};

export async function executeSubmitPlanCode(
  input: ExecuteSubmitPlanCodeInput,
): Promise<SubmitPlanCodeResult> {
  const executeSandbox = input.runSandbox ?? runSandbox;

  input.onRunStatus?.("sandbox");

  const sandboxResult = await executeSandbox({
    artifact: {
      type: "plan",
      currentPlan: input.currentPlan,
      generatedPython: input.python,
    },
  });

  if (!sandboxResult.ok) {
    return {
      ok: false,
      errors: [{ code: sandboxResult.code, message: sandboxResult.message }],
    };
  }

  input.onRunStatus?.("validating");

  const validated = loadWorkoutPlan(sandboxResult.plan);
  if (!validated.ok) {
    return { ok: false, errors: validated.errors };
  }

  return { ok: true, plan: validated.plan };
}
