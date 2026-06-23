import type { Day, Exercise, Set } from "@/lib/plans/workout-plan";
import { getDayBlocks, isBlockEditable } from "@/lib/plans/day-blocks";

export function isSetEditable(set: Set): boolean {
  return set.status === "planned";
}

export function isExerciseEditable(exercise: Exercise): boolean {
  return exercise.sets.some(isSetEditable);
}

export function isDayEditable(day: Day): boolean {
  return getDayBlocks(day).some(isBlockEditable);
}

export function isSupersetExerciseEditable(
  exercises: Exercise[],
  exerciseIndex: number,
): boolean {
  return isExerciseEditable(exercises[exerciseIndex]);
}
