import { createClient } from "@/utils/supabase/data-client";

export type LibraryExercise = { id: string; name: string; video_url?: string | null };
export type ExerciseUsage = { templates: number; assignments: number };

export async function listCoachExercises(coachId: string, query = "", page = 1) {
  const db = await createClient();
  const offset = (page - 1) * 30;
  const { data, error } = await db
    .from("exercises")
    .select("id,name,video_url")
    .eq("owner_coach_id", coachId)
    .is("archived_at", null)
    .ilike("name", `%${query.replace(/[%_\\]/g, "")}%`)
    .order("name")
    .order("id")
    .range(offset, offset + 30);
  if (error) throw error;
  return { exercises: (data ?? []).slice(0, 30), hasMore: (data?.length ?? 0) > 30 };
}

export async function exerciseUsage(exerciseId: string): Promise<ExerciseUsage | null> {
  const db = await createClient();
  const { data, error } = await db.rpc("coach_exercise_usage", { p_exercise_id: exerciseId });
  if (error) throw error;
  return data as ExerciseUsage | null;
}

export async function manageExercise(
  exerciseId: string,
  input: { name?: string; archive?: boolean; replacementId?: string },
) {
  const db = await createClient();
  const { error } = await db.rpc("manage_coach_exercise", {
    p_exercise_id: exerciseId,
    p_name: input.name ?? null,
    p_archive: input.archive ?? false,
    p_replacement_id: input.replacementId ?? null,
  });
  if (error) throw error;
}
