import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ApplyExerciseVideoLinkOptions = {
  weekIndex: number;
  dayIndex: number;
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
        for (const exercise of day.exercises) {
          // Match by name for now; switch to exercise IDs once all exercises have stable ids.
          if (exercise.name === options.exerciseName) {
            exercise.videoUrl = normalizedUrl;
          }
        }
      }
    }

    return newPlan;
  }

  const week = newPlan.weeks.find((candidate) => candidate.index === options.weekIndex);
  const day = week?.days.find((candidate) => candidate.index === options.dayIndex);
  const exercise = day?.exercises[options.exerciseIndex];

  if (exercise) {
    exercise.videoUrl = normalizedUrl;
  }

  return newPlan;
}
