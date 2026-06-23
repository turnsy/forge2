import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { getDayBlocks, isExerciseBlock } from "@/lib/plans/day-blocks";

export type ApplyExerciseVideoLinkOptions = {
  weekIndex: number;
  dayIndex: number;
  blockIndex: number;
  exerciseIndex: number;
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
        for (const block of getDayBlocks(day)) {
          const exercises = isExerciseBlock(block)
            ? [block.exercise]
            : block.exercises;

          for (const exercise of exercises) {
            if (exercise.name === options.exerciseName) {
              exercise.videoUrl = normalizedUrl;
            }
          }
        }
      }
    }

    return newPlan;
  }

  const week = newPlan.weeks.find((candidate) => candidate.index === options.weekIndex);
  const day = week?.days.find((candidate) => candidate.index === options.dayIndex);
  const block = day ? getDayBlocks(day)[options.blockIndex] : undefined;

  if (!block) {
    return newPlan;
  }

  const exercise = isExerciseBlock(block)
    ? options.exerciseIndex === 0
      ? block.exercise
      : undefined
    : block.exercises[options.exerciseIndex];

  if (exercise) {
    exercise.videoUrl = normalizedUrl;
  }

  return newPlan;
}
