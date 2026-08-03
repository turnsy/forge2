import { resolveCurrentMax } from "@/lib/maxes/resolve-current-max";

export type AthleteMaxEntry = {
  id: string;
  exercise_id: string;
  exercise_name: string;
  value: number;
  unit: string;
  logged_at: string;
};

export type ExerciseMaxSummary = {
  exerciseId: string;
  exerciseName: string;
  currentValue: number;
  currentUnit: string;
  loggedAt: string;
  history: AthleteMaxEntry[];
};

export function groupMaxesByExercise(maxes: AthleteMaxEntry[]): ExerciseMaxSummary[] {
  const byExercise = new Map<string, AthleteMaxEntry[]>();

  for (const max of maxes) {
    const history = byExercise.get(max.exercise_id) ?? [];
    history.push(max);
    byExercise.set(max.exercise_id, history);
  }

  const summaries: ExerciseMaxSummary[] = [];

  for (const [exerciseId, history] of byExercise) {
    const sorted = [...history].sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime(),
    );
    const current = resolveCurrentMax(
      history.map((entry) => ({
        value: entry.value,
        unit: entry.unit,
        loggedAt: entry.logged_at,
      })),
    );
    const currentEntry =
      sorted.find(
        (entry) =>
          current &&
          entry.value === current.value &&
          entry.unit === current.unit,
      ) ?? sorted[0];

    summaries.push({
      exerciseId,
      exerciseName: currentEntry.exercise_name,
      currentValue: current?.value ?? currentEntry.value,
      currentUnit: current?.unit ?? currentEntry.unit,
      loggedAt: currentEntry.logged_at,
      history: sorted,
    });
  }

  return summaries.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));
}

export function filterMaxSummaries(
  summaries: ExerciseMaxSummary[],
  query: string,
): ExerciseMaxSummary[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return summaries;
  }

  return summaries.filter((summary) =>
    summary.exerciseName.toLowerCase().includes(trimmed),
  );
}
