import type { WorkoutPlan } from "@/lib/plans/workout-plan";
/** Only percentage prescriptions need a max; custom bases take precedence. */
export function percentageMaxRequirements(plan: WorkoutPlan) {
  const required = new Map<string, { exerciseId: string; exerciseName: string }>();
  for (const week of plan.weeks)
    for (const day of week.days)
      for (const block of day.blocks)
        for (const exercise of block.exercises) {
          if (!exercise.sets.some((set) => set.planned.target?.type === "percentage")) continue;
          const exerciseId = exercise.resolvedBasisExerciseId ?? exercise.resolvedExerciseId;
          if (!exerciseId)
            throw new Error(
              `Select a percentage basis for ${exercise.name} before assigning the plan.`,
            );
          required.set(exerciseId, {
            exerciseId,
            exerciseName: exercise.basisRaw?.trim() || exercise.name,
          });
        }
  return [...required.values()];
}
