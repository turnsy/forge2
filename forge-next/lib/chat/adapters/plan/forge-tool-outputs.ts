import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ForgeToolIssue = {
  code?: string;
  path?: string;
  message: string;
};

export type SubmitPlanCodeSuccess = {
  ok: true;
  plan: WorkoutPlan;
  title: string;
};

export type SubmitPlanCodeFailure = {
  ok: false;
  errors: ForgeToolIssue[];
};

export type SubmitPlanCodeOutput = SubmitPlanCodeSuccess | SubmitPlanCodeFailure;

export type SetCurrentArtifactSuccess = {
  ok: true;
  planId: string;
  name: string;
  summary: string;
  plan: WorkoutPlan;
};

export type SetCurrentArtifactFailure = {
  ok: false;
  code?: string;
  message: string;
};

export type SetCurrentArtifactOutput =
  | SetCurrentArtifactSuccess
  | SetCurrentArtifactFailure;

export type ClearCurrentArtifactOutput = {
  ok: true;
  message: string;
};

export type PlanArtifactToolSuccess = {
  ok: true;
  plan: WorkoutPlan;
  planId?: string;
  title?: string;
  name?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isSubmitPlanCodeOutput(
  output: unknown,
): output is SubmitPlanCodeOutput {
  if (!isRecord(output) || typeof output.ok !== "boolean") {
    return false;
  }

  if (output.ok) {
    return isRecord(output.plan);
  }

  return Array.isArray(output.errors);
}

export function isPlanArtifactToolSuccess(
  output: unknown,
): output is PlanArtifactToolSuccess {
  return isRecord(output) && output.ok === true && isRecord(output.plan);
}

export function isToolErrorsOutput(
  output: unknown,
): output is { ok: false; errors: ForgeToolIssue[] } {
  return (
    isRecord(output) &&
    output.ok === false &&
    Array.isArray(output.errors)
  );
}

export function toForgeToolDisplayErrors(
  errors: ForgeToolIssue[],
): Array<{ path?: string; code?: string; message: string }> {
  return errors.map((entry) =>
    entry.path
      ? { path: entry.path, message: entry.message }
      : { code: entry.code, message: entry.message },
  );
}
