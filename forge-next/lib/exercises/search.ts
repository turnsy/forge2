import { createClient } from "@/utils/supabase/data-client";
import { embedExercise } from "./embeddings";
import { normalize_v1 } from "./normalize";
import { findExactExercise } from "./repository";

export type ExerciseSearchResult = {
  id: string;
  name: string;
  owner_coach_id: string | null;
  score: number;
};

export type ExerciseSearchOption = {
  id: string;
  name: string;
};

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "");
}

export function mergeExerciseSearchOptions(
  groups: ExerciseSearchOption[][],
  limit = 5,
): ExerciseSearchOption[] {
  const seen = new Set<string>();
  const merged: ExerciseSearchOption[] = [];

  for (const group of groups) {
    for (const item of group) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      merged.push(item);
      if (merged.length >= limit) {
        return merged;
      }
    }
  }

  return merged;
}

export async function searchExercisesByText(
  query: string,
  coachId: string,
  limit = 5,
): Promise<ExerciseSearchOption[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createClient();
  const exact = await findExactExercise(trimmed, coachId, supabase);
  const namePattern = `%${escapeIlikePattern(trimmed)}%`;
  const normalizedPattern = `%${escapeIlikePattern(normalize_v1(trimmed))}%`;

  const [byName, byNormalized] = await Promise.all([
    supabase
      .from("exercises")
      .select("id,name")
      .or(`owner_coach_id.eq.${coachId},owner_coach_id.is.null`)
      .ilike("name", namePattern)
      .limit(limit),
    supabase
      .from("exercises")
      .select("id,name")
      .or(`owner_coach_id.eq.${coachId},owner_coach_id.is.null`)
      .ilike("normalized_name", normalizedPattern)
      .limit(limit),
  ]);

  if (byName.error) throw byName.error;
  if (byNormalized.error) throw byNormalized.error;

  return mergeExerciseSearchOptions(
    [
      exact ? [{ id: exact.id, name: exact.name }] : [],
      (byName.data ?? []).map((row) => ({ id: row.id, name: row.name })),
      (byNormalized.data ?? []).map((row) => ({ id: row.id, name: row.name })),
    ],
    limit,
  );
}

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
