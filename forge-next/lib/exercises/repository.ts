import { normalize_v1 } from "./normalize";
import { createClient } from "@/utils/supabase/data-client";

export type ExerciseRecord = {
  id: string;
  name: string;
  normalized_name: string;
  owner_coach_id: string | null;
};

type ExercisesClient = Awaited<ReturnType<typeof createClient>>;

export async function findExactExercise(
  raw: string,
  coachId: string,
  client?: ExercisesClient,
): Promise<ExerciseRecord | null> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("exercises")
    .select("id,name,normalized_name,owner_coach_id")
    .eq("normalized_name", normalize_v1(raw))
    .or(`owner_coach_id.eq.${coachId},owner_coach_id.is.null`)
    .order("owner_coach_id", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as ExerciseRecord | null;
}

export async function createCoachExercise(
  name: string,
  coachId: string,
  client?: ExercisesClient,
): Promise<ExerciseRecord> {
  const supabase = client ?? (await createClient());
  const { data, error } = await supabase
    .from("exercises")
    .insert({ name: name.trim(), normalized_name: normalize_v1(name), owner_coach_id: coachId })
    .select("id,name,normalized_name,owner_coach_id")
    .single();
  if (error) throw error;
  return data as ExerciseRecord;
}
