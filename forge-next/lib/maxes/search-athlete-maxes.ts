import { normalizeExercise } from "@/lib/exercises/normalize";
import { groupMaxesByExercise, type ExerciseMaxSummary } from "@/lib/maxes/group-by-exercise";
import { listAthleteMaxesWithExerciseNames } from "@/lib/maxes/list-with-exercise-names";

export type AthleteMaxSearchResult = ExerciseMaxSummary & {
  score: number;
};

function scoreExerciseName(query: string, exerciseName: string): number {
  const normalizedQuery = normalizeExercise(query);
  const normalizedName = normalizeExercise(exerciseName);

  if (!normalizedQuery) {
    return 0;
  }

  if (normalizedName === normalizedQuery) {
    return 100;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 90;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 75;
  }

  const queryTokens = normalizedQuery.split(" ").filter(Boolean);
  const nameTokens = new Set(normalizedName.split(" ").filter(Boolean));
  const matchedTokens = queryTokens.filter((token) => nameTokens.has(token)).length;

  if (matchedTokens === 0) {
    return 0;
  }

  return 40 + Math.round((matchedTokens / queryTokens.length) * 40);
}

export function rankAthleteMaxSummaries(
  summaries: ExerciseMaxSummary[],
  query: string,
  limit = 10,
): AthleteMaxSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return summaries.slice(0, limit).map((summary) => ({ ...summary, score: 0 }));
  }

  return summaries
    .map((summary) => ({
      ...summary,
      score: scoreExerciseName(trimmed, summary.exerciseName),
    }))
    .filter((summary) => summary.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.exerciseName.localeCompare(right.exerciseName);
    })
    .slice(0, limit);
}

export async function searchAthleteMaxes(
  athleteId: string,
  query: string,
  limit = 10,
): Promise<AthleteMaxSearchResult[]> {
  const maxes = await listAthleteMaxesWithExerciseNames(athleteId);
  const summaries = groupMaxesByExercise(
    maxes.map((max) => ({
      id: max.id,
      exercise_id: max.exercise_id,
      exercise_name: max.exercise_name,
      value: Number(max.value),
      unit: max.unit,
      logged_at: max.logged_at,
    })),
  );

  return rankAthleteMaxSummaries(summaries, query, limit);
}
