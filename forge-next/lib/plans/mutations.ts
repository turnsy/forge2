import { createClient } from "@/utils/supabase/server";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type CreateCoachPlanResult =
  | { ok: true; planId: string; versionId: string }
  | { ok: false; code: "unauthorized" | "not_found" | "db_error"; message: string };

export type SaveCoachPlanVersionResult =
  | { ok: true; versionId: string }
  | { ok: false; code: "unauthorized" | "not_found" | "db_error"; message: string };

type CreateCoachPlanRpcRow = {
  plan_id: string;
  version_id: string;
};

type SaveCoachPlanVersionRpcRow = {
  version_id: string;
};

function mapRpcError(message: string): CreateCoachPlanResult | SaveCoachPlanVersionResult {
  const lower = message.toLowerCase();

  if (lower.includes("not authenticated")) {
    return { ok: false, code: "unauthorized", message };
  }

  if (lower.includes("plan not found")) {
    return { ok: false, code: "not_found", message };
  }

  return { ok: false, code: "db_error", message };
}

export async function createCoachPlan(
  plan: WorkoutPlan,
  changeSummary: string | null = null,
): Promise<CreateCoachPlanResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_coach_plan", {
    p_plan_data: plan,
    p_change_summary: changeSummary,
  });

  if (error) {
    return mapRpcError(error.message) as CreateCoachPlanResult;
  }

  const row = (data as CreateCoachPlanRpcRow[] | null)?.[0];

  if (!row?.plan_id || !row.version_id) {
    return {
      ok: false,
      code: "db_error",
      message: "Plan was not created",
    };
  }

  return {
    ok: true,
    planId: row.plan_id,
    versionId: row.version_id,
  };
}

export async function saveCoachPlanVersion(
  planId: string,
  plan: WorkoutPlan,
  changeSummary: string | null = null,
): Promise<SaveCoachPlanVersionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_coach_plan_version", {
    p_plan_id: planId,
    p_plan_data: plan,
    p_change_summary: changeSummary,
  });

  if (error) {
    return mapRpcError(error.message) as SaveCoachPlanVersionResult;
  }

  const row = (data as SaveCoachPlanVersionRpcRow[] | null)?.[0];

  if (!row?.version_id) {
    return {
      ok: false,
      code: "db_error",
      message: "Plan version was not saved",
    };
  }

  return {
    ok: true,
    versionId: row.version_id,
  };
}
