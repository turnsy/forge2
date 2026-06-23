import type { Day, Exercise, Set, WorkoutPlan } from "@/lib/plans/workout-plan";

export function createSetId(): string {
  return crypto.randomUUID();
}

export function createExerciseId(): string {
  return crypto.randomUUID();
}

export function createDefaultSet(): Set {
  return {
    id: createSetId(),
    planned: {
      type: "exact",
      reps: 10,
      load: { type: "absolute", value: 0, unit: "lb" },
    },
    actual: null,
    status: "planned",
    locked: false,
  };
}

export function createDefaultExercise(): Exercise {
  return {
    id: createExerciseId(),
    name: "New Exercise",
    sets: [createDefaultSet()],
  };
}

export function createEmptyWorkoutPlan(name = "New Plan"): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name,
    weeks: [
      {
        index: 1,
        days: [createDefaultDay()],
      },
    ],
  };
}

export function createDefaultDay(): Day {
  return {
    index: 1,
    code: "w1d1",
    exercises: [createDefaultExercise()],
  };
}

export function isDefaultDayContent(day: Day): boolean {
  if (day.exercises.length !== 1) {
    return false;
  }

  const exercise = day.exercises[0];
  if (exercise.name !== "New Exercise" || exercise.sets.length !== 1) {
    return false;
  }

  const set = exercise.sets[0];
  if (set.planned.type !== "exact") {
    return false;
  }

  const load = set.planned.load;
  return (
    set.planned.reps === 10 &&
    load.type === "absolute" &&
    load.value === 0 &&
    load.unit === "lb"
  );
}
