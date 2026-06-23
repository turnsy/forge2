import type { Day, Exercise, WorkoutPlan } from "@/lib/plans/workout-plan";

export function exerciseBlock(exercise: Exercise): Day["blocks"][number] {
  return { type: "exercise", exercise };
}

export function dayFromExercises(
  exercises: Exercise[],
  overrides: Partial<Day> = {},
): Day {
  return {
    index: 1,
    code: "w1d1",
    blocks: exercises.map(exerciseBlock) as Day["blocks"],
    ...overrides,
  };
}

export function getBlockExercise(day: Day, blockIndex = 0): Exercise {
  const block = day.blocks[blockIndex];
  if (!block || block.type !== "exercise") {
    throw new Error(`Expected exercise block at index ${blockIndex}`);
  }

  return block.exercise;
}

export const minimalWorkoutPlan: WorkoutPlan = {
  schemaVersion: "2.1.0",
  name: "4-Week Strength Block",
  weeks: [
    {
      index: 1,
      days: [
        dayFromExercises([
          {
            name: "Back Squat",
            sets: [
              {
                id: "w1d1-bs-1",
                planned: {
                  type: "exact",
                  reps: 5,
                  load: { type: "absolute", value: 100, unit: "kg" },
                },
                actual: null,
                status: "planned",
                locked: false,
              },
            ],
          },
        ]),
      ],
    },
  ],
};
