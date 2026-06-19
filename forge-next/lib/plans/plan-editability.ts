import type { Day, Exercise, Set } from "@/lib/plans/workout-plan";

export function isSetEditable(set: Set): boolean {
  return set.status === "planned";
}

export function isExerciseEditable(exercise: Exercise): boolean {
  return exercise.sets.some(isSetEditable);
}

export function isDayEditable(day: Day): boolean {
  return day.exercises.some(isExerciseEditable);
}
