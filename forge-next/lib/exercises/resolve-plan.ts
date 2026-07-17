import type { Exercise, WorkoutPlan } from "@/lib/plans/workout-plan";

export type ExerciseCandidate = {
  id: string;
  name: string;
  score?: number;
};

export type ExerciseResolver = (
  raw: string,
  options: { candidates: ExerciseCandidate[]; isBasis: boolean },
) => Promise<string | null>;

function updateExercise(
  exercise: Exercise,
  resolvedExerciseId: string | null,
  resolvedBasisExerciseId: string | null,
): Exercise {
  return {
    ...exercise,
    resolvedExerciseId: resolvedExerciseId ?? exercise.resolvedExerciseId,
    ...(resolvedBasisExerciseId && resolvedBasisExerciseId !== resolvedExerciseId
      ? { resolvedBasisExerciseId }
      : {}),
  };
}

/**
 * Resolves each distinct exercise/basis string once and returns a new artifact.
 * Persistence and candidate retrieval stay behind the resolver callback.
 */
export async function resolvePlanExercises(
  plan: WorkoutPlan,
  resolver: ExerciseResolver,
): Promise<WorkoutPlan> {
  const cache = new Map<string, string | null>();
  const resolve = async (raw: string, isBasis: boolean) => {
    const key = `${isBasis ? "basis" : "exercise"}:${raw}`;
    if (!cache.has(key)) cache.set(key, await resolver(raw, { candidates: [], isBasis }));
    return cache.get(key) ?? null;
  };

  const next = structuredClone(plan);
  for (const week of next.weeks) {
    for (const day of week.days) {
      for (const block of day.blocks) {
        for (const exercise of block.exercises) {
          const basisRaw = exercise.basisRaw?.trim() || exercise.name;
          const exerciseId = await resolve(exercise.name, false);
          const basisId = await resolve(basisRaw, true);
          Object.assign(
            exercise,
            updateExercise(exercise, exerciseId, basisId),
            basisRaw !== exercise.name ? { basisRaw } : {},
          );
        }
      }
    }
  }
  return next;
}
