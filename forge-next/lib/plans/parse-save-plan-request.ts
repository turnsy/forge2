import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type SavePlanRequestBody = {
  plan: WorkoutPlan;
  title: string;
  changeSummary?: string | null;
};

export type ParseSavePlanRequestResult =
  | { ok: true; body: SavePlanRequestBody }
  | { ok: false; message: string };

export function parseSavePlanRequest(value: unknown): ParseSavePlanRequestResult {
  if (!value || typeof value !== "object") {
    return { ok: false, message: "Request body is required" };
  }

  const body = value as Record<string, unknown>;

  if (!body.plan || typeof body.plan !== "object") {
    return { ok: false, message: "plan is required" };
  }

  if (typeof body.title !== "string") {
    return { ok: false, message: "title is required" };
  }

  const changeSummary =
    body.changeSummary === undefined || body.changeSummary === null
      ? null
      : typeof body.changeSummary === "string"
        ? body.changeSummary
        : null;

  if (
    body.changeSummary !== undefined &&
    body.changeSummary !== null &&
    typeof body.changeSummary !== "string"
  ) {
    return { ok: false, message: "changeSummary must be a string" };
  }

  return {
    ok: true,
    body: {
      plan: body.plan as WorkoutPlan,
      title: body.title,
      changeSummary,
    },
  };
}
