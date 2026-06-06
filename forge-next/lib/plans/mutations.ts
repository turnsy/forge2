import {
  ServiceErrorCode,
  mapRpcErrorMessage,
  serviceError,
  type ServiceError,
  type ServiceResult,
} from "@/lib/errors/service-error";
import { createClient } from "@/utils/supabase/server";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type CreateCoachPlanResult = ServiceResult<{
  planId: string;
  versionId: string;
}>;

export type SaveCoachPlanVersionResult = ServiceResult<{
  versionId: string;
}>;

type CreateCoachPlanRpcRow = {
  plan_id: string;
  version_id: string;
};

type SaveCoachPlanVersionRpcRow = {
  version_id: string;
};

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
    return mapRpcErrorMessage(error.message);
  }

  const row = (data as CreateCoachPlanRpcRow[] | null)?.[0];

  if (!row?.plan_id || !row.version_id) {
    return serviceError(ServiceErrorCode.DB_ERROR, "Plan was not created");
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
    return mapRpcErrorMessage(error.message);
  }

  const row = (data as SaveCoachPlanVersionRpcRow[] | null)?.[0];

  if (!row?.version_id) {
    return serviceError(
      ServiceErrorCode.DB_ERROR,
      "Plan version was not saved",
    );
  }

  return {
    ok: true,
    versionId: row.version_id,
  };
}

export type { ServiceError };
