import { escapeIlikePattern } from "@/lib/lists/escape-ilike";
import {
  getListOffset,
  normalizeListQuery,
  toPaginatedResult,
} from "@/lib/lists/query";
import type { ListQuery, PaginatedResult } from "@/lib/lists/types";
import { createClient } from "@/utils/supabase/server";
import type {
  CoachAthleteListItem,
  CoachAthleteRow,
  CoachAthleteSummary,
} from "@/lib/athletes/types";

type CoachAthleteRowWithCount = CoachAthleteRow & {
  total_count: number;
};

export function mapCoachAthleteRow(row: CoachAthleteRow): CoachAthleteListItem {
  return {
    id: row.athlete_id,
    name: row.full_name?.trim() || "Unnamed athlete",
    email: row.email?.trim() || "",
    currentPlanName: row.current_plan_name?.trim() || null,
    joinedAt: row.linked_at,
  };
}

export function mapCoachAthleteSummary(row: CoachAthleteRow): CoachAthleteSummary {
  return {
    id: row.athlete_id,
    name: row.full_name?.trim() || "Unnamed athlete",
  };
}

function getTotalCount(rows: CoachAthleteRowWithCount[]): number {
  return rows.length > 0 ? Number(rows[0].total_count) : 0;
}

export async function listCoachAthletes(
  query: ListQuery = normalizeListQuery({}),
): Promise<PaginatedResult<CoachAthleteListItem>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_coach_athletes", {
    p_search: query.q ? escapeIlikePattern(query.q) : null,
    p_limit: query.limit,
    p_offset: getListOffset(query),
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data as CoachAthleteRowWithCount[] | null) ?? [];
  const items = rows.map(mapCoachAthleteRow);

  return toPaginatedResult(items, getTotalCount(rows), query);
}

export async function listCoachAthleteSummaries(
  query: ListQuery = normalizeListQuery({}),
): Promise<PaginatedResult<CoachAthleteSummary>> {
  const result = await listCoachAthletes(query);

  return {
    ...result,
    items: result.items.map((athlete) => ({
      id: athlete.id,
      name: athlete.name,
    })),
  };
}
