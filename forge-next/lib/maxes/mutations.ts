import { createClient } from "@/utils/supabase/data-client";

export type MaxSource =
  | "tested"
  | "coach_entered"
  | "athlete_entered"
  | "estimated_from_log";

export type AthleteMaxRecord = {
  id: string;
  athlete_id: string;
  exercise_id: string;
  value: number;
  unit: string;
  source: MaxSource;
  logged_at: string;
};

export async function listAthleteMaxes(
  athleteId: string,
  exerciseIds?: string[],
): Promise<AthleteMaxRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_athlete_maxes", {
    p_athlete_id: athleteId,
    p_exercise_ids: exerciseIds ?? null,
  });
  if (error) throw error;
  return (data ?? []) as AthleteMaxRecord[];
}

export async function insertAthleteMax(input: {
  athleteId: string;
  exerciseId: string;
  value: number;
  unit: string;
  source: MaxSource;
}): Promise<AthleteMaxRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("insert_athlete_max", {
    p_athlete_id: input.athleteId,
    p_exercise_id: input.exerciseId,
    p_value: input.value,
    p_unit: input.unit,
    p_source: input.source,
  });
  if (error) throw error;
  return data as AthleteMaxRecord;
}
