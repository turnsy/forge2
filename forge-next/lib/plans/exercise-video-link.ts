import { updateFlattenedExercise } from "@/lib/plans/day-blocks";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ApplyExerciseVideoLinkOptions = {
  weekPos: number;
  dayPos: number;
  exercisePos: number;
  exerciseName: string;
  videoUrl: string | undefined;
  addToAll: boolean;
};

export function normalizeExerciseVideoUrl(videoUrl: string | undefined): string | undefined {
  const trimmed = videoUrl?.trim();
  return trimmed || undefined;
}

export function applyExerciseVideoLink(
  plan: WorkoutPlan,
  options: ApplyExerciseVideoLinkOptions,
): WorkoutPlan {
  const newPlan = structuredClone(plan);
  const normalizedUrl = normalizeExerciseVideoUrl(options.videoUrl);

  if (options.addToAll) {
    for (const week of newPlan.weeks) {
      for (const day of week.days) {
        for (const block of day.blocks) {
          for (const exercise of block.exercises) {
            if (exercise.name === options.exerciseName) {
              exercise.videoUrl = normalizedUrl;
            }
          }
        }
      }
    }

    return newPlan;
  }

  const day = newPlan.weeks[options.weekPos]?.days[options.dayPos];
  if (!day) {
    return newPlan;
  }

  const updatedDay = updateFlattenedExercise(day, options.exercisePos, (exercise) => ({
    ...exercise,
    videoUrl: normalizedUrl,
  }));
  newPlan.weeks[options.weekPos].days[options.dayPos] = updatedDay;

  return newPlan;
}
