import {
  ServiceErrorCode,
  serviceError,
  type ServiceResult,
} from "@/lib/errors/service-error";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { createClient } from "@/utils/supabase/data-client";

export const ASSIGNED_PLAN_COLUMNS =
  "id, athlete_id, coach_id, plan_data, status, assigned_at, completed_at, unassigned_at, plan_version_id";

type AssignedPlanRow = {
  id: string;
  athlete_id: string;
  coach_id: string;
  plan_data: unknown;
  status: "active" | "completed" | "unassigned";
  assigned_at: string;
  completed_at: string | null;
  unassigned_at: string | null;
  plan_version_id: string | null;
};

export type AssignedPlan = {
  id: string;
  athleteId: string;
  coachId: string;
  status: "active" | "completed" | "unassigned";
  assignedAt: string;
  completedAt: string | null;
  unassignedAt: string | null;
  planVersionId: string | null;
  plan: WorkoutPlan;
};

export type ActiveAssignedPlanResult = ServiceResult<{ plan: AssignedPlan | null }>;

type AssignedPlanClient = Awaited<ReturnType<typeof createClient>>;

export function mapAssignedPlanRow(row: AssignedPlanRow): AssignedPlan | null {
  const result = loadWorkoutPlan(row.plan_data);

  if (!result.ok) {
    return null;
  }

  return {
    id: row.id,
    athleteId: row.athlete_id,
    coachId: row.coach_id,
    status: row.status,
    assignedAt: row.assigned_at,
    completedAt: row.completed_at,
    unassignedAt: row.unassigned_at,
    planVersionId: row.plan_version_id,
    plan: result.plan,
  };
}

export async function queryActiveAssignedPlan(
  athleteId: string,
  client?: AssignedPlanClient,
): Promise<ActiveAssignedPlanResult> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("assigned_plans")
    .select(ASSIGNED_PLAN_COLUMNS)
    .eq("athlete_id", athleteId)
    .eq("status", "active")
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return serviceError(ServiceErrorCode.DB_ERROR, error.message);
  }

  if (!data) {
    return { ok: true, plan: null };
  }

  return { ok: true, plan: mapAssignedPlanRow(data as AssignedPlanRow) };
}
