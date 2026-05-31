import { createClient } from "@/utils/supabase/server";
import { getPlanStats, parseWorkoutPlan } from "@/lib/plans/stats";
import type { CoachPlanListItem, CoachPlanSummary } from "@/lib/plans/types";

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
