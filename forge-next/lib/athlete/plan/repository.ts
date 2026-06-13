import { unstable_noStore as noStore } from "next/cache";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { createClient } from "@/utils/supabase/server";
import {
  areAllDaysComplete,
  completeDayInPlan,
  type SetCompletionStatus,
} from "@/lib/athlete/plan/domain";

type AthletePlanClient = Awaited<ReturnType<typeof createClient>>;

type AssignedPlanRow = {
  id: string;
  athlete_id: string;
  coach_id: string;
  plan_data: unknown;
  status: "active" | "completed" | "unassigned";
  assigned_at: string;
  completed_at: string | null;
  plan_version_id: string | null;
};

export type AssignedPlan = {
  id: string;
  athleteId: string;
  coachId: string;
  status: "active" | "completed" | "unassigned";
  assignedAt: string;
  completedAt: string | null;
  planVersionId: string | null;
  plan: WorkoutPlan;
};

async function resolveClient(client?: AthletePlanClient): Promise<AthletePlanClient> {
  return client ?? (await createClient());
}

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
    planVersionId: row.plan_version_id,
    plan: result.plan,
  };
}

export async function getActiveAthletePlan(
  userId: string,
  client?: AthletePlanClient,
): Promise<AssignedPlan | null> {
  noStore();
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("assigned_plans")
    .select(
      "id, athlete_id, coach_id, plan_data, status, assigned_at, completed_at, plan_version_id",
    )
    .eq("athlete_id", userId)
    .eq("status", "active")
    .order("assigned_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapAssignedPlanRow(data as AssignedPlanRow);
}

export async function getAssignedPlanById(
  assignmentId: string,
  client?: AthletePlanClient,
): Promise<AssignedPlan | null> {
  noStore();
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("assigned_plans")
    .select(
      "id, athlete_id, coach_id, plan_data, status, assigned_at, completed_at, plan_version_id",
    )
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapAssignedPlanRow(data as AssignedPlanRow);
}

export async function listAthleteAssignedPlans(
  athleteId: string,
  coachId: string,
  client?: AthletePlanClient,
): Promise<AssignedPlan[]> {
  noStore();
  const supabase = await resolveClient(client);
  const { data, error } = await supabase
    .from("assigned_plans")
    .select(
      "id, athlete_id, coach_id, plan_data, status, assigned_at, completed_at, plan_version_id",
    )
    .eq("athlete_id", athleteId)
    .eq("coach_id", coachId)
    .neq("status", "active")
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as AssignedPlanRow[] | null) ?? [])
    .map(mapAssignedPlanRow)
    .filter((plan): plan is AssignedPlan => plan !== null);
}

export async function savePlanActuals(
  assignmentId: string,
  planData: WorkoutPlan,
  client?: AthletePlanClient,
): Promise<void> {
  const validation = loadWorkoutPlan(planData);
  if (!validation.ok) {
    throw new Error("Invalid plan data");
  }

  const supabase = await resolveClient(client);
  const { error } = await supabase
    .from("assigned_plans")
    .update({ plan_data: validation.plan as unknown as Record<string, unknown> })
    .eq("id", assignmentId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function completeDay(
  assignmentId: string,
  planData: WorkoutPlan,
  weekIdx: number,
  dayIdx: number,
  client?: AthletePlanClient,
): Promise<{ allDaysDone: boolean; plan: WorkoutPlan; setStatuses: { setIndex: number; status: SetCompletionStatus }[] }> {
  const { plan, setStatuses } = completeDayInPlan(planData, weekIdx, dayIdx);
  const allDaysDone = areAllDaysComplete(plan);
  const completedAt = allDaysDone ? new Date().toISOString() : null;

  const validation = loadWorkoutPlan(plan);
  if (!validation.ok) {
    throw new Error("Invalid plan data");
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
    throw new Error(error.message);
  }

  return { allDaysDone, plan: validation.plan, setStatuses };
}
