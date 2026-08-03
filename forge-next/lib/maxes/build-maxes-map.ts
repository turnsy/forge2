import type { MaxValue } from "@/lib/maxes/compute-weight";
import type { AthleteMaxRecord } from "@/lib/maxes/mutations";
import { resolveCurrentMax } from "@/lib/maxes/resolve-current-max";

export function buildMaxesByExerciseId(
  rows: AthleteMaxRecord[],
): Record<string, MaxValue> {
  const byExercise = new Map<string, AthleteMaxRecord[]>();

  for (const row of rows) {
    const history = byExercise.get(row.exercise_id) ?? [];
    history.push(row);
    byExercise.set(row.exercise_id, history);
  }

  const maxesByExerciseId: Record<string, MaxValue> = {};

  for (const [exerciseId, history] of byExercise) {
    const current = resolveCurrentMax(
      history.map((row) => ({
        value: Number(row.value),
        unit: row.unit,
        loggedAt: row.logged_at,
        source: row.source,
      })),
    );

    if (current) {
      maxesByExerciseId[exerciseId] = {
        value: current.value,
        unit: current.unit,
      };
    }
  }

  return maxesByExerciseId;
}
