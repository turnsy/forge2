import { createClient } from "@/utils/supabase/data-client";
import { normalizeExercise } from "./normalize";

export type ExerciseSearchOption = {
  id: string;
  name: string;
};

export function mergeExerciseSearchOptions(
  groups: ExerciseSearchOption[][],
  limit = 5,
): ExerciseSearchOption[] {
  const seen = new Set<string>();
  const merged: ExerciseSearchOption[] = [];

  for (const group of groups) {
    for (const item of group) {
      const key = normalizeExercise(item.name);
      if (seen.has(key)) continue;
      seen.add(key);
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
  includeTemplates = true,
): Promise<ExerciseSearchOption[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_coach_exercises", {
    p_coach_id: coachId,
    p_query: trimmed,
    p_limit: limit,
    p_include_templates: includeTemplates,
  });
  if (error) throw error;
  return mergeExerciseSearchOptions([data ?? []], limit);
}
