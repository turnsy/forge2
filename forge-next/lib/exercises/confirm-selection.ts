import { createCoachExercise, findExactExercise, type ExerciseRecord } from "./repository";
import { createClient } from "@/utils/supabase/data-client";

export async function getAccessibleExercise(
  exerciseId: string,
  coachId: string,
): Promise<ExerciseRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("id,name,normalized_name,owner_coach_id")
    .eq("id", exerciseId)
    .or(`owner_coach_id.eq.${coachId},owner_coach_id.is.null`)
    .maybeSingle();
  if (error) throw error;
  return data as ExerciseRecord | null;
}

export async function confirmExerciseSelection(
  input: { exerciseId?: string; name?: string },
  coachId: string,
): Promise<ExerciseRecord> {
  if (input.exerciseId) {
    const existing = await getAccessibleExercise(input.exerciseId, coachId);
    if (!existing) {
      throw new Error("Exercise not found");
    }
    return existing;
  }

  const name = input.name?.trim();
  if (!name) {
    throw new Error("Exercise name is required");
  }

  const exact = await findExactExercise(name, coachId);
  if (exact) {
    return exact;
  }

  return createCoachExercise(name, coachId);
}
