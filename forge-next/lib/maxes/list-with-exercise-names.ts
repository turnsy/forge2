import { createClient } from "@/utils/supabase/data-client";
import { listAthleteMaxes, type AthleteMaxRecord } from "@/lib/maxes/mutations";

export type AthleteMaxWithExerciseName = AthleteMaxRecord & {
  exercise_name: string;
};

export async function listAthleteMaxesWithExerciseNames(
  athleteId: string,
  exerciseIds?: string[],
): Promise<AthleteMaxWithExerciseName[]> {
  const maxes = await listAthleteMaxes(athleteId, exerciseIds);
  if (maxes.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const ids = [...new Set(maxes.map((max) => max.exercise_id))];
  const { data, error } = await supabase.from("exercises").select("id,name").in("id", ids);
  if (error) {
    throw error;
  }

  const nameById = new Map((data ?? []).map((row) => [row.id, row.name]));

  return maxes.map((max) => ({
    ...max,
    exercise_name: nameById.get(max.exercise_id) ?? max.exercise_id,
  }));
}
