import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { resolveExercise } from "./resolve";

/**
 * Save boundary: every exercise gets a catalog id. Unmatched names become a
 * private coach exercise rather than leaving a persisted null reference.
 */
export async function preparePlanExerciseResolution(
  plan: WorkoutPlan,
  coachId: string,
): Promise<WorkoutPlan> {
  const cache = new Map<string, string>();
  const next = structuredClone(plan);
  for (const week of next.weeks) {
    for (const day of week.days) {
      for (const block of day.blocks) {
        for (const exercise of block.exercises) {
          const rawBasis = exercise.basisRaw?.trim() || exercise.name;
          const cachedExerciseId = cache.get(exercise.name);
          const exerciseResult =
            exercise.resolvedExerciseId || cachedExerciseId
              ? null
              : await resolveExercise(exercise.name, coachId);
          const exerciseId =
            exercise.resolvedExerciseId ?? cachedExerciseId ?? exerciseResult?.exerciseId;
          if (!exerciseId) throw new Error(`Could not resolve exercise "${exercise.name}"`);
          cache.set(exercise.name, exerciseId);
          exercise.resolvedExerciseId = exerciseId;
          if (rawBasis !== exercise.name) {
            exercise.basisRaw = rawBasis;
            const cachedBasisId = cache.get(rawBasis);
            const basisResult =
              exercise.resolvedBasisExerciseId || cachedBasisId
                ? null
                : await resolveExercise(rawBasis, coachId);
            exercise.resolvedBasisExerciseId =
              exercise.resolvedBasisExerciseId ?? cachedBasisId ?? basisResult?.exerciseId;
            if (!exercise.resolvedBasisExerciseId) {
              throw new Error(`Could not resolve basis "${rawBasis}"`);
            }
            cache.set(rawBasis, exercise.resolvedBasisExerciseId);
          } else {
            delete exercise.basisRaw;
            delete exercise.resolvedBasisExerciseId;
          }
        }
      }
    }
  }
  return next;
}
