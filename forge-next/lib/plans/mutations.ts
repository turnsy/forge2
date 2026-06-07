import {
  ServiceErrorCode,
  mapRpcErrorMessage,
  serviceError,
  type ServiceError,
  type ServiceResult,
} from "@/lib/errors/service-error";
import { createClient } from "@/utils/supabase/server";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

type PlansClient = Awaited<ReturnType<typeof createClient>>;

async function resolveClient(client?: PlansClient): Promise<PlansClient> {
  return client ?? (await createClient());
}

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
  client?: PlansClient,
): Promise<CreateCoachPlanResult> {
  const supabase = await resolveClient(client);
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
  client?: PlansClient,
): Promise<SaveCoachPlanVersionResult> {
  const supabase = await resolveClient(client);
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

export type AssignPlanToAthletesResult = ServiceResult<Record<string, never>>;

export type DeleteCoachPlanResult = ServiceResult<Record<string, never>>;

export type CoachPlanDeleteInfoResult = ServiceResult<{
  planTitle: string;
  activeAssignmentCount: number;
}>;

type CoachPlanDeleteInfoRpcRow = {
  plan_title: string | null;
  active_assignment_count: number | string | null;
};

export async function assignPlanToAthletes(
  planId: string,
  athleteIds: string[],
  client?: PlansClient,
): Promise<AssignPlanToAthletesResult> {
  if (athleteIds.length === 0) {
    return serviceError(
      ServiceErrorCode.VALIDATION_ERROR,
      "Select at least one athlete",
    );
  }

  const supabase = await resolveClient(client);
  const { error } = await supabase.rpc("assign_plan_to_athletes", {
    p_plan_id: planId,
    p_athlete_ids: athleteIds,
  });

  if (error) {
    return mapRpcErrorMessage(error.message);
  }

  return { ok: true };
}

export async function deleteCoachPlan(
  planId: string,
  client?: PlansClient,
): Promise<DeleteCoachPlanResult> {
  const supabase = await resolveClient(client);
  const { error } = await supabase.rpc("delete_coach_plan", {
    p_plan_id: planId,
  });

  if (error) {
    return mapRpcErrorMessage(error.message);
  }

  return { ok: true };
}

export async function getCoachPlanDeleteInfo(
  planId: string,
  client?: PlansClient,
): Promise<CoachPlanDeleteInfoResult> {
  const supabase = await resolveClient(client);
  const { data, error } = await supabase.rpc("get_coach_plan_delete_info", {
    p_plan_id: planId,
  });

  if (error) {
    return mapRpcErrorMessage(error.message);
  }

  const row = (data as CoachPlanDeleteInfoRpcRow[] | null)?.[0];

  if (!row) {
    return serviceError(ServiceErrorCode.NOT_FOUND, "Plan not found");
  }

  return {
    ok: true,
    planTitle: row.plan_title?.trim() || "Untitled plan",
    activeAssignmentCount: Number(row.active_assignment_count ?? 0),
  };
}

export type { ServiceError };
