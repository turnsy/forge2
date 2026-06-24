import type { Block, Day, Exercise } from "@/lib/plans/workout-plan";

export function createBlockId(): string {
  return crypto.randomUUID();
}

export function flattenDayExercises(day: Day): Exercise[] {
  return day.blocks.flatMap((block) => block.exercises);
}

export type FlattenedExerciseRef = {
  blockPos: number;
  exercisePos: number;
  exercise: Exercise;
};

export function getFlattenedExerciseRefs(day: Day): FlattenedExerciseRef[] {
  const refs: FlattenedExerciseRef[] = [];

  day.blocks.forEach((block, blockPos) => {
    block.exercises.forEach((exercise, exercisePos) => {
      refs.push({ blockPos, exercisePos, exercise });
    });
  });

  return refs;
}

export function getFlattenedExercise(
  day: Day,
  flatExercisePos: number,
): FlattenedExerciseRef | null {
  return getFlattenedExerciseRefs(day)[flatExercisePos] ?? null;
}

export function isSupersetBlock(block: Block): boolean {
  return block.exercises.length > 1;
}

export function mapDayBlocks(
  day: Day,
  mapper: (block: Block, blockPos: number) => Block,
): Day {
  return {
    ...day,
    blocks: day.blocks.map((block, blockPos) => mapper(block, blockPos)) as Day["blocks"],
  };
}

export function updateFlattenedExercise(
  day: Day,
  flatExercisePos: number,
  updater: (exercise: Exercise) => Exercise,
): Day {
  const ref = getFlattenedExercise(day, flatExercisePos);
  if (!ref) {
    return day;
  }

  return mapDayBlocks(day, (block, blockPos) => {
    if (blockPos !== ref.blockPos) {
      return block;
    }

    return {
      ...block,
      exercises: block.exercises.map((exercise, exercisePos) =>
        exercisePos === ref.exercisePos ? updater(exercise) : exercise,
      ) as Block["exercises"],
    };
  });
}

export function updateFlattenedSet(
  day: Day,
  flatExercisePos: number,
  setPos: number,
  updater: (set: Exercise["sets"][number]) => Exercise["sets"][number],
): Day {
  return updateFlattenedExercise(day, flatExercisePos, (exercise) => ({
    ...exercise,
    sets: exercise.sets.map((set, currentSetPos) =>
      currentSetPos === setPos ? updater(set) : set,
    ) as Exercise["sets"],
  }));
}

export function applyLocalActualsToDay(
  day: Day,
  formState: Record<string, { reps: string; target: string }>,
  getSetKey: (exercisePos: number, setPos: number) => string,
  buildActual: (
    reps: string,
    target: string,
    set: import("@/lib/plans/workout-plan").Set,
  ) => import("@/lib/plans/workout-plan").ActualSet | null,
): Day {
  let result = day;

  getFlattenedExerciseRefs(day).forEach((ref, exercisePos) => {
    ref.exercise.sets.forEach((set, setPos) => {
      const local = formState[getSetKey(exercisePos, setPos)];
      if (!local) {
        return;
      }

      const actual = buildActual(local.reps, local.target, set);
      if (!actual) {
        return;
      }

      result = updateFlattenedSet(result, exercisePos, setPos, (currentSet) => ({
        ...currentSet,
        actual,
      }));
    });
  });

  return result;
}

export function getFlatExercisePos(
  day: Day,
  blockPos: number,
  exercisePosInBlock: number,
): number {
  let offset = 0;
  for (let index = 0; index < blockPos; index += 1) {
    offset += day.blocks[index]?.exercises.length ?? 0;
  }
  return offset + exercisePosInBlock;
}

export function cloneDay(day: Day): Day {
  return structuredClone(day);
}
