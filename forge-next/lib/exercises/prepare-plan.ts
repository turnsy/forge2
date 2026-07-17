import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { createCoachExercise, findExactExercise } from "./repository";
import { searchExercises, isAutoResolvable } from "./search";
import { resolveAmbiguousExercises } from "./llm-resolution";

/**
 * Save boundary: every exercise gets a catalog id. Unmatched names become a
 * private coach exercise rather than leaving a persisted null reference.
 */
export async function preparePlanExerciseResolution(
  plan: WorkoutPlan,
  coachId: string,
): Promise<WorkoutPlan> {
  const cache = new Map<string, string>();
  const rawValues = new Set<string>();
  for (const week of plan.weeks) {
    for (const day of week.days) {
      for (const block of day.blocks) {
        for (const exercise of block.exercises) {
          rawValues.add(exercise.name);
          if (exercise.basisRaw?.trim()) rawValues.add(exercise.basisRaw.trim());
        }
      }
    }
  }

  const ambiguous = new Map<string, Awaited<ReturnType<typeof searchExercises>>>();
  for (const raw of rawValues) {
    const exact = await findExactExercise(raw, coachId);
    if (exact) {
      cache.set(raw, exact.id);
      continue;
    }
    try {
      const results = await searchExercises(raw, coachId, 5);
      if (!isAutoResolvable(results)) ambiguous.set(raw, results);
      else if (results[0]) cache.set(raw, results[0].id);
    } catch {
      ambiguous.set(raw, []);
    }
  }
  const modelResults = await resolveAmbiguousExercises({
    values: [...ambiguous.keys()],
    candidates: Object.fromEntries(ambiguous),
    catalog: Object.values(Object.fromEntries(ambiguous)).flat(),
  });

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
              : await createOrResolve(exercise.name, coachId, modelResults, cache);
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
                  : await createOrResolve(rawBasis, coachId, modelResults, cache);
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

async function createOrResolve(
  raw: string,
  coachId: string,
  modelResults: Map<string, string | null>,
  cache: Map<string, string>,
) {
  const modelId = modelResults.get(raw);
  if (modelId) {
    cache.set(raw, modelId);
    return { exerciseId: modelId };
  }
  const created = await createCoachExercise(raw, coachId);
  cache.set(raw, created.id);
  return { exerciseId: created.id };
}
