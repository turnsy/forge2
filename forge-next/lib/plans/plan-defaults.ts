import type {
  Day,
  Exercise,
  ExerciseBlock,
  Set,
  SupersetGroup,
  WorkoutPlan,
} from "@/lib/plans/workout-plan";
import { createExerciseBlock, migrateDayToBlocks } from "@/lib/plans/day-blocks";

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

export function createDefaultExercise(name = "New Exercise"): Exercise {
  return {
    id: createExerciseId(),
    name,
    sets: [createDefaultSet()],
  };
}

export function createDefaultExerciseBlock(): ExerciseBlock {
  return createExerciseBlock(createDefaultExercise());
}

export function createDefaultSuperset(): SupersetGroup {
  return {
    type: "superset",
    exercises: [
      createDefaultExercise("Exercise A"),
      createDefaultExercise("Exercise B"),
    ].map((exercise) => ({
      ...exercise,
      sets: [createDefaultSet(), createDefaultSet(), createDefaultSet()] as Exercise["sets"],
    })) as SupersetGroup["exercises"],
  };
}

export function createEmptyWorkoutPlan(name = "New Plan"): WorkoutPlan {
  return {
    schemaVersion: "2.1.0",
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
    blocks: [createDefaultExerciseBlock()],
  };
}

export function isDefaultDayContent(day: Day): boolean {
  const normalized = migrateDayToBlocks(day);

  if (normalized.blocks.length !== 1) {
    return false;
  }

  const block = normalized.blocks[0];
  if (block.type !== "exercise") {
    return false;
  }

  const exercise = block.exercise;
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
