import { createClient } from "@/utils/supabase/data-client";
import { embedExercise } from "./embeddings";
import { normalize_v1 } from "./normalize";

export type ExerciseSearchResult = {
  id: string;
  name: string;
  owner_coach_id: string | null;
  score: number;
};

export async function searchExercises(
  query: string,
  coachId: string,
  limit = 5,
): Promise<ExerciseSearchResult[]> {
  const normalized = normalize_v1(query);
  if (!normalized) return [];
  const embedding = await embedExercise(normalized);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_exercises", {
    p_coach_id: coachId,
    p_embedding: embedding,
    p_limit: limit,
  });
  if (error) throw error;
  return (data ?? []) as ExerciseSearchResult[];
}

export function isAutoResolvable(
  results: Pick<ExerciseSearchResult, "score">[],
  threshold = 0.85,
  margin = 0.05,
): boolean {
  const [first, second] = results;
  return Boolean(
    first &&
      first.score >= threshold &&
      (!second || first.score - second.score >= margin),
  );
}
