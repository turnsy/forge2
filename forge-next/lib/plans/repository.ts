import { createClient } from "@/utils/supabase/server";
import { parseWorkoutPlan } from "@/lib/plans/parse-workout-plan";
import { getPlanStats } from "@/lib/plans/stats";
import type { CoachPlanListItem, CoachPlanSummary } from "@/lib/plans/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { loadWorkoutPlan, type WorkoutPlanValidationError } from "@/lib/plans/validate";

type PlanRow = {
  id: string;
  created_at: string;
  active_version: { plan_data: unknown } | { plan_data: unknown }[] | null;
};

function getActiveVersionPlanData(
  activeVersion: PlanRow["active_version"],
): unknown {
  if (!activeVersion) {
    return null;
  }

  if (Array.isArray(activeVersion)) {
    return activeVersion[0]?.plan_data ?? null;
  }

  return activeVersion.plan_data;
}

export function mapCoachPlanRow(row: PlanRow): CoachPlanListItem | null {
  const planData = parseWorkoutPlan(getActiveVersionPlanData(row.active_version));

  if (!planData) {
    return null;
  }

  const { weekCount, daysPerWeek } = getPlanStats(planData);

  return {
    id: row.id,
    title: planData.name,
    weekCount,
    daysPerWeek,
    createdAt: row.created_at,
  };
}

type PlanSummaryRow = {
  id: string;
  active_version: { plan_data: unknown } | { plan_data: unknown }[] | null;
};

export function mapCoachPlanSummaryRow(row: PlanSummaryRow): CoachPlanSummary | null {
  const planData = getActiveVersionPlanData(row.active_version);

  if (!planData || typeof planData !== "object") {
    return null;
  }

  const name = (planData as { name?: unknown }).name;

  if (typeof name !== "string" || name.trim().length === 0) {
    return null;
  }

  return {
    id: row.id,
    title: name.trim(),
  };
}

export async function listCoachPlanSummaries(
  coachId: string,
): Promise<CoachPlanSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plans")
    .select(
      `
      id,
      active_version:plan_versions!plans_active_version_id_fkey (
        plan_data
      )
    `,
    )
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as PlanSummaryRow[] | null) ?? [])
    .map(mapCoachPlanSummaryRow)
    .filter((plan): plan is CoachPlanSummary => plan !== null);
}

export async function listCoachPlans(coachId: string): Promise<CoachPlanListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plans")
    .select(
      `
      id,
      created_at,
      active_version:plan_versions!plans_active_version_id_fkey (
        plan_data
      )
    `,
    )
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data as PlanRow[] | null) ?? [])
    .map(mapCoachPlanRow)
    .filter((plan): plan is CoachPlanListItem => plan !== null);
}

export type CoachPlanDetail = {
  id: string;
  createdAt: string;
  plan: WorkoutPlan;
};

export type CoachPlanFetchResult =
  | { status: "ok"; detail: CoachPlanDetail }
  | { status: "not_found" }
  | { status: "invalid"; errors: WorkoutPlanValidationError[] };

export function mapCoachPlanDetailRow(
  row: PlanRow,
): Extract<CoachPlanFetchResult, { status: "ok" | "invalid" }> {
  const planData = getActiveVersionPlanData(row.active_version);
  const result = loadWorkoutPlan(planData);

  if (!result.ok) {
    return { status: "invalid", errors: result.errors };
  }

  return {
    status: "ok",
    detail: {
      id: row.id,
      createdAt: row.created_at,
      plan: result.plan,
    },
  };
}

export async function getCoachPlanById(
  coachId: string,
  planId: string,
): Promise<CoachPlanFetchResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plans")
    .select(
      `
      id,
      created_at,
      active_version:plan_versions!plans_active_version_id_fkey (
        plan_data
      )
    `,
    )
    .eq("coach_id", coachId)
    .eq("id", planId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { status: "not_found" };
  }

  return mapCoachPlanDetailRow(data as PlanRow);
}
