import { unstable_noStore as noStore } from "next/cache";
import {
  ServiceErrorCode,
  serviceError,
  type ServiceResult,
} from "@/lib/errors/service-error";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { getAthleteCoachLink } from "@/lib/links/repository";
import { createClient } from "@/utils/supabase/server";
import {
  areAllDaysComplete,
  completeDayInPlan,
  type SetCompletionStatus,
} from "@/lib/athlete/plan/domain";
import {
  ASSIGNED_PLAN_COLUMNS,
  mapAssignedPlanRow,
  queryActiveAssignedPlan,
  type AssignedPlan,
} from "@/lib/athlete/plan/assigned-plan-data";

type AthletePlanClient = Awaited<ReturnType<typeof createClient>>;

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

export type { AssignedPlan };
export { mapAssignedPlanRow };

export type ActiveAthletePlanResult = ServiceResult<{ plan: AssignedPlan | null }>;
export type AssignedPlanByIdResult = ServiceResult<{ plan: AssignedPlan | null }>;
export type ListAthleteAssignedPlansResult = ServiceResult<{ plans: AssignedPlan[] }>;
export type ListMyPlanHistoryResult = ServiceResult<{ plans: AssignedPlan[] }>;
export type SavePlanActualsResult = ServiceResult<Record<never, never>>;
export type CompleteDayResult = ServiceResult<{
  allDaysDone: boolean;
  plan: WorkoutPlan;
  setStatuses: { setIndex: number; status: SetCompletionStatus }[];
}>;

async function resolveClient(client?: AthletePlanClient): Promise<AthletePlanClient> {
  return client ?? (await createClient());
}

export async function getActiveAthletePlan(
  userId: string,
  client?: AthletePlanClient,
): Promise<ActiveAthletePlanResult> {
  noStore();
  const supabase = await resolveClient(client);
  return queryActiveAssignedPlan(userId, supabase);
}

export async function getAssignedPlanById(
  assignmentId: string,
  client?: AthletePlanClient,
): Promise<AssignedPlanByIdResult> {
  noStore();
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("assigned_plans")
    .select(ASSIGNED_PLAN_COLUMNS)
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    return serviceError(ServiceErrorCode.DB_ERROR, error.message);
  }

  if (!data) {
    return { ok: true, plan: null };
  }

  return { ok: true, plan: mapAssignedPlanRow(data as AssignedPlanRow) };
}

export async function listAthleteAssignedPlans(
  athleteId: string,
  coachId: string,
  client?: AthletePlanClient,
): Promise<ListAthleteAssignedPlansResult> {
  noStore();
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("assigned_plans")
    .select(ASSIGNED_PLAN_COLUMNS)
    .eq("athlete_id", athleteId)
    .eq("coach_id", coachId)
    .neq("status", "active")
    .order("assigned_at", { ascending: false });

  if (error) {
    return serviceError(ServiceErrorCode.DB_ERROR, error.message);
  }

  const plans = ((data as AssignedPlanRow[] | null) ?? [])
    .map(mapAssignedPlanRow)
    .filter((plan): plan is AssignedPlan => plan !== null);

  return { ok: true, plans };
}

export async function listMyPlanHistory(
  userId: string,
  client?: AthletePlanClient,
): Promise<ListMyPlanHistoryResult> {
  const link = await getAthleteCoachLink(client);

  if (!link) {
    return { ok: true, plans: [] };
  }

  return listAthleteAssignedPlans(userId, link.coachId, client);
}

export async function savePlanActuals(
  assignmentId: string,
  planData: WorkoutPlan,
  client?: AthletePlanClient,
): Promise<SavePlanActualsResult> {
  const validation = loadWorkoutPlan(planData);
  if (!validation.ok) {
    return serviceError(ServiceErrorCode.VALIDATION_ERROR, "Invalid plan data");
  }

  const supabase = await resolveClient(client);
  const { error } = await supabase
    .from("assigned_plans")
    .update({ plan_data: validation.plan as unknown as Record<string, unknown> })
    .eq("id", assignmentId);

  if (error) {
    return serviceError(ServiceErrorCode.DB_ERROR, error.message);
  }

  return { ok: true };
}

export async function completeDay(
  assignmentId: string,
  planData: WorkoutPlan,
  weekPos: number,
  dayPos: number,
  client?: AthletePlanClient,
): Promise<CompleteDayResult> {
  const { plan, setStatuses } = completeDayInPlan(planData, weekPos, dayPos);
  const allDaysDone = areAllDaysComplete(plan);
  const completedAt = allDaysDone ? new Date().toISOString() : null;

  const validation = loadWorkoutPlan(plan);
  if (!validation.ok) {
    return serviceError(ServiceErrorCode.VALIDATION_ERROR, "Invalid plan data");
  }

  const supabase = await resolveClient(client);
  const { error } = await supabase
    .from("assigned_plans")
    .update({
      plan_data: validation.plan as unknown as Record<string, unknown>,
      ...(allDaysDone
        ? {
            status: "completed" as const,
            completed_at: completedAt,
          }
        : {}),
    })
    .eq("id", assignmentId);

  if (error) {
    return serviceError(ServiceErrorCode.DB_ERROR, error.message);
  }

  return { ok: true, allDaysDone, plan: validation.plan, setStatuses };
}
