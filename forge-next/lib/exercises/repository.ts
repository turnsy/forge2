import { normalizeExercise } from "./normalize";
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
    .eq("normalized_name", normalizeExercise(raw))
    .eq("owner_coach_id", coachId)
    .is("archived_at", null)
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
  if (!name.trim()) throw new Error("Exercise name is required");
  const { data, error } = await supabase.rpc("claim_coach_exercise", { p_name: name.trim() });
  if (error) throw error;
  if (data.owner_coach_id !== coachId) throw new Error("Exercise owner does not match the coach");
  return data as ExerciseRecord;
}
