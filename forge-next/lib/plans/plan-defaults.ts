import type { Block, Day, Exercise, Set, WorkoutPlan } from "@/lib/plans/workout-plan";
import { createBlockId } from "@/lib/plans/day-blocks";

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
      target: { type: "absolute", value: 0, unit: "lb" },
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

export function createDefaultBlock(): Block {
  return {
    id: createBlockId(),
    exercises: [createDefaultExercise()],
  };
}

export function createDefaultSupersetBlock(): Block {
  return {
    id: createBlockId(),
    exercises: [createDefaultExercise(), createDefaultExercise()],
  };
}

export function createEmptyWorkoutPlan(name = "New Plan"): WorkoutPlan {
  return {
    schemaVersion: "3.0.0",
    name,
    weeks: [
      {
        days: [createDefaultDay()],
      },
    ],
  };
}

export function createDefaultDay(): Day {
  return {
    code: "w1d1",
    blocks: [createDefaultBlock()],
  };
}

export function isDefaultDayContent(day: Day): boolean {
  if (day.blocks.length !== 1) {
    return false;
  }

  const block = day.blocks[0];
  if (block.exercises.length !== 1) {
    return false;
  }

  const exercise = block.exercises[0];
  if (exercise.name !== "New Exercise" || exercise.sets.length !== 1) {
    return false;
  }

  const set = exercise.sets[0];
  if (set.planned.type !== "exact") {
    return false;
  }

  const load = set.planned.target;
  return (
    set.planned.reps === 10 &&
    load.type === "absolute" &&
    load.value === 0 &&
    load.unit === "lb"
  );
}
