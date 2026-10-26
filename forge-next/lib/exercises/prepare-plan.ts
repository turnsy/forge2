import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { createCoachExercise, findExactExercise } from "./repository";
import { getAccessibleExercise } from "./confirm-selection";
import { normalizeExercise } from "./normalize";

/** Preserve confirmed selections; imported names use exact lookup or a new private entry. */
export async function preparePlanExerciseResolution(
  plan: WorkoutPlan,
  coachId: string,
): Promise<WorkoutPlan> {
  const cache = new Map<string, string>();

  async function resolve(name: string, selectedId?: string): Promise<string> {
    const normalized = normalizeExercise(name);
    if (!normalized) throw new Error("Exercise name is required");
    if (selectedId) {
      const selected = await getAccessibleExercise(selectedId, coachId);
      if (!selected) throw new Error("Selected exercise is not accessible");
      if (normalizeExercise(selected.name) === normalized) return selected.id;
      // An agent may rename an exercise without clearing its old catalog ID.
    }
    const cached = cache.get(normalized);
    if (cached) return cached;
    const exercise = (await findExactExercise(name, coachId)) ?? (await createCoachExercise(name, coachId));
    cache.set(normalized, exercise.id);
    return exercise.id;
  }

  const next = structuredClone(plan);
  for (const week of next.weeks) {
    for (const day of week.days) {
      for (const block of day.blocks) {
        for (const exercise of block.exercises) {
          exercise.resolvedExerciseId = await resolve(exercise.name, exercise.resolvedExerciseId);
          const basis = exercise.basisRaw?.trim();
          if (basis && normalizeExercise(basis) !== normalizeExercise(exercise.name)) {
            exercise.basisRaw = basis;
            exercise.resolvedBasisExerciseId = await resolve(basis, exercise.resolvedBasisExerciseId);
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
