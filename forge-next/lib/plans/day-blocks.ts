import type {
  Day,
  DayBlock,
  Exercise,
  ExerciseBlock,
  Set,
  SupersetGroup,
  WorkoutPlan,
} from "@/lib/plans/workout-plan";

type LegacyDay = Day & { exercises?: Exercise[] };

export function isExerciseBlock(block: DayBlock): block is ExerciseBlock {
  return block.type === "exercise";
}

export function isSupersetGroup(block: DayBlock): block is SupersetGroup {
  return block.type === "superset";
}

export function createExerciseBlock(exercise: Exercise): ExerciseBlock {
  return { type: "exercise", exercise };
}

export function migrateDayToBlocks(day: LegacyDay): Day {
  if (Array.isArray(day.blocks) && day.blocks.length > 0) {
    const { exercises: _legacyExercises, ...rest } = day;
    void _legacyExercises;
    return rest as Day;
  }

  const exercises = day.exercises ?? [];
  const { exercises: _legacyExercises, ...rest } = day;
  void _legacyExercises;
  return {
    ...rest,
    blocks: exercises.map((exercise) => createExerciseBlock(exercise)) as Day["blocks"],
  };
}

export function migratePlanToBlocks(plan: WorkoutPlan): WorkoutPlan {
  if (!Array.isArray(plan.weeks)) {
    return plan;
  }

  if (plan.schemaVersion === "2.1.0") {
    return {
      ...plan,
      weeks: plan.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => migrateDayToBlocks(day as LegacyDay)),
      })) as typeof plan.weeks,
    };
  }

  if (plan.schemaVersion === "2.0.0") {
    return {
      ...plan,
      schemaVersion: "2.1.0",
      weeks: plan.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => migrateDayToBlocks(day as LegacyDay)),
      })) as typeof plan.weeks,
    };
  }

  return plan;
}

export function getDayBlocks(day: LegacyDay): Day["blocks"] {
  return migrateDayToBlocks(day).blocks;
}

export function iterateDayExercises(day: LegacyDay): Exercise[] {
  const blocks = getDayBlocks(day);
  const exercises: Exercise[] = [];

  for (const block of blocks) {
    if (isExerciseBlock(block)) {
      exercises.push(block.exercise);
      continue;
    }

    exercises.push(...block.exercises);
  }

  return exercises;
}

export function isBlockEditable(block: DayBlock): boolean {
  if (isExerciseBlock(block)) {
    return block.exercise.sets.some((set) => set.status === "planned");
  }

  return block.exercises.some((exercise) =>
    exercise.sets.some((set) => set.status === "planned"),
  );
}

export type SetLocation = {
  blockIdx: number;
  exerciseIdx: number;
  setIdx: number;
};

export function getSetAtLocation(day: Day, location: SetLocation): Set | null {
  const block = day.blocks[location.blockIdx];
  if (!block) {
    return null;
  }

  const exercise = isExerciseBlock(block)
    ? block.exercise
    : block.exercises[location.exerciseIdx];

  return exercise?.sets[location.setIdx] ?? null;
}

export function getSetKey(blockIdx: number, exerciseIdx: number, setIdx: number): string {
  return `${blockIdx}-${exerciseIdx}-${setIdx}`;
}

export function parseSetKey(key: string): SetLocation | null {
  const parts = key.split("-");
  if (parts.length !== 3) {
    return null;
  }

  const blockIdx = Number(parts[0]);
  const exerciseIdx = Number(parts[1]);
  const setIdx = Number(parts[2]);

  if ([blockIdx, exerciseIdx, setIdx].some((value) => Number.isNaN(value))) {
    return null;
  }

  return { blockIdx, exerciseIdx, setIdx };
}

export function getExerciseAtLocation(
  day: Day,
  blockIdx: number,
  exerciseIdx: number,
): Exercise | null {
  const block = day.blocks[blockIdx];
  if (!block) {
    return null;
  }

  if (isExerciseBlock(block)) {
    return exerciseIdx === 0 ? block.exercise : null;
  }

  return block.exercises[exerciseIdx] ?? null;
}

export function getSupersetRoundCount(superset: SupersetGroup): number {
  if (superset.exercises.length === 0) {
    return 0;
  }

  return superset.exercises[0].sets.length;
}
