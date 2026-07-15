import {
  createCoachExercise,
  findExactExercise,
  type ExerciseRecord,
} from "./repository";

export type ResolveExerciseResult = {
  exerciseId: string;
  exercise: ExerciseRecord;
  tier: 1 | 2 | 3 | "manual";
  created: boolean;
};

/**
 * The repository boundary is intentionally small: Tier 2/3 providers can be
 * added without changing plan traversal or persistence semantics.
 */
export async function resolveExercise(
  raw: string,
  coachId: string,
  options: {
    resolveEmbedding?: (
      raw: string,
      coachId: string,
    ) => Promise<ExerciseRecord | null>;
    resolveWithModel?: (
      raw: string,
      coachId: string,
    ) => Promise<ExerciseRecord | null>;
  } = {},
): Promise<ResolveExerciseResult> {
  const exact = await findExactExercise(raw, coachId);
  if (exact) {
    return { exerciseId: exact.id, exercise: exact, tier: 1, created: false };
  }

  const semantic = await options.resolveEmbedding?.(raw, coachId);
  if (semantic) {
    return { exerciseId: semantic.id, exercise: semantic, tier: 2, created: false };
  }

  const model = await options.resolveWithModel?.(raw, coachId);
  if (model) {
    return { exerciseId: model.id, exercise: model, tier: 3, created: false };
  }

  const created = await createCoachExercise(raw, coachId);
  return { exerciseId: created.id, exercise: created, tier: 3, created: true };
}
