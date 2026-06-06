import {
  escapeIlikePattern,
  getListOffset,
  normalizeListQuery,
  toPaginatedResult,
} from "@/lib/lists/query";
import type { ListQuery, PaginatedResult } from "@/lib/lists/types";
import { createClient } from "@/utils/supabase/server";
import { parseWorkoutPlan } from "@/lib/plans/parse-workout-plan";
import { formatDaysPerWeek, getPlanStats } from "@/lib/plans/stats";
import type { CoachPlanListItem } from "@/lib/plans/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { loadWorkoutPlan, type WorkoutPlanValidationError } from "@/lib/plans/validate";

type PlanRow = {
  id: string;
  created_at: string;
  active_version: { plan_data: unknown } | { plan_data: unknown }[] | null;
};

type CoachPlanRpcRow = {
  plan_id: string;
  title: string;
  week_count: number;
  min_days_per_week: number;
  max_days_per_week: number;
  created_at: string;
  total_count: number;
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

export function mapCoachPlanRpcRow(row: CoachPlanRpcRow): CoachPlanListItem | null {
  const title = row.title?.trim();

  if (!title) {
    return null;
  }

  return {
    id: row.plan_id,
    title,
    weekCount: row.week_count,
    daysPerWeek: formatDaysPerWeek(row.min_days_per_week, row.max_days_per_week),
    createdAt: row.created_at,
  };
}

function getTotalCount(rows: CoachPlanRpcRow[]): number {
  return rows.length > 0 ? Number(rows[0].total_count) : 0;
}

export async function listCoachPlans(
  _coachId: string,
  query: ListQuery = normalizeListQuery({}),
): Promise<PaginatedResult<CoachPlanListItem>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_coach_plans", {
    p_search: query.q ? escapeIlikePattern(query.q) : null,
    p_limit: query.limit,
    p_offset: getListOffset(query),
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as CoachPlanRpcRow[] | null) ?? [];
  const items = rows
    .map(mapCoachPlanRpcRow)
    .filter((plan): plan is CoachPlanListItem => plan !== null);

  return toPaginatedResult(items, getTotalCount(rows), query);
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
