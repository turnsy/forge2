import { createClient } from "@/utils/supabase/server";
import type { CoachAthleteListItem, CoachAthleteRow } from "@/lib/athletes/types";

export function mapCoachAthleteRow(row: CoachAthleteRow): CoachAthleteListItem {
  return {
    id: row.athlete_id,
    name: row.full_name?.trim() || "Unnamed athlete",
    email: row.email?.trim() || "",
    currentPlanName: row.current_plan_name?.trim() || null,
    joinedAt: row.linked_at,
  };
}

export async function listCoachAthletes(): Promise<CoachAthleteListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_coach_athletes");

  if (error) {
    throw new Error(error.message);
  }

  return ((data as CoachAthleteRow[] | null) ?? []).map(mapCoachAthleteRow);
}
