import { flattenDayExercises } from "@/lib/plans/day-blocks";
import type { Day, Exercise, Set, WorkoutPlan } from "@/lib/plans/workout-plan";
import type { WorkoutPlanValidationError } from "@/lib/plans/validate";

export function isSetEditable(set: Set): boolean {
  return set.status === "planned" && !set.locked;
}

export function isExerciseEditable(exercise: Exercise): boolean {
  return exercise.sets.some(isSetEditable);
}

export function isDayEditable(day: Day): boolean {
  return flattenDayExercises(day).some(isExerciseEditable);
}

type IndexedSet = {
  set: Set;
  path: string;
  editable: boolean;
};

type IndexedExercise = {
  exercise: Exercise;
  path: string;
  editable: boolean;
};

type IndexedDay = {
  day: Day;
  path: string;
  editable: boolean;
};

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

function collectPlanSets(plan: WorkoutPlan): Map<string, IndexedSet> {
  const sets = new Map<string, IndexedSet>();

  plan.weeks.forEach((week, weekPos) => {
    week.days.forEach((day, dayPos) => {
      day.blocks.forEach((block, blockPos) => {
        block.exercises.forEach((exercise, exercisePos) => {
          exercise.sets.forEach((set, setPos) => {
            sets.set(set.id, {
              set,
              path: `/weeks/${weekPos}/days/${dayPos}/blocks/${blockPos}/exercises/${exercisePos}/sets/${setPos}`,
              editable: isSetEditable(set),
            });
          });
        });
      });
    });
  });

  return sets;
}

function collectPlanExercises(plan: WorkoutPlan): Map<string, IndexedExercise> {
  const exercises = new Map<string, IndexedExercise>();

  plan.weeks.forEach((week, weekPos) => {
    week.days.forEach((day, dayPos) => {
      day.blocks.forEach((block, blockPos) => {
        block.exercises.forEach((exercise, exercisePos) => {
          exercises.set(exercise.id, {
            exercise,
            path: `/weeks/${weekPos}/days/${dayPos}/blocks/${blockPos}/exercises/${exercisePos}`,
            editable: isExerciseEditable(exercise),
          });
        });
      });
    });
  });

  return exercises;
}

function collectPlanDays(plan: WorkoutPlan): Map<string, IndexedDay> {
  const days = new Map<string, IndexedDay>();

  plan.weeks.forEach((week, weekPos) => {
    week.days.forEach((day, dayPos) => {
      days.set(day.code, {
        day,
        path: `/weeks/${weekPos}/days/${dayPos}`,
        editable: isDayEditable(day),
      });
    });
  });

  return days;
}

function pushLockedSubtreeError(
  errors: WorkoutPlanValidationError[],
  path: string,
  entity: "day" | "exercise" | "set",
): void {
  const message =
    entity === "day"
      ? "Cannot edit a day that contains only completed, skipped, or locked work."
      : entity === "exercise"
        ? "Cannot edit an exercise that contains only completed, skipped, or locked sets."
        : "Cannot edit a set that is already completed, skipped, or locked.";

  errors.push({ path, message });
}

/**
 * Rejects assigned-plan edits that touch logged or locked work, or change
 * athlete-owned status/actual fields.
 */
export function assertEditableChange(
  before: WorkoutPlan,
  after: WorkoutPlan,
): WorkoutPlanValidationError[] {
  const errors: WorkoutPlanValidationError[] = [];
  const beforeSets = collectPlanSets(before);
  const afterSets = collectPlanSets(after);
  const beforeExercises = collectPlanExercises(before);
  const afterExercises = collectPlanExercises(after);
  const beforeDays = collectPlanDays(before);
  const afterDays = collectPlanDays(after);

  for (const [id, beforeRef] of beforeSets) {
    const afterRef = afterSets.get(id);

    if (!afterRef) {
      if (!beforeRef.editable) {
        pushLockedSubtreeError(errors, beforeRef.path, "set");
      }
      continue;
    }

    const statusChanged = beforeRef.set.status !== afterRef.set.status;
    const actualChanged =
      stableJson(beforeRef.set.actual) !== stableJson(afterRef.set.actual);

    if (statusChanged || actualChanged) {
      errors.push({
        path: afterRef.path,
        message: "Set status and logged actuals cannot be changed.",
      });
      continue;
    }

    if (
      !beforeRef.editable &&
      stableJson(beforeRef.set) !== stableJson(afterRef.set)
    ) {
      pushLockedSubtreeError(errors, afterRef.path, "set");
    }
  }

  for (const [id, beforeRef] of beforeExercises) {
    const afterRef = afterExercises.get(id);

    if (!afterRef) {
      if (!beforeRef.editable) {
        pushLockedSubtreeError(errors, beforeRef.path, "exercise");
      }
      continue;
    }

    if (
      !beforeRef.editable &&
      stableJson(beforeRef.exercise) !== stableJson(afterRef.exercise)
    ) {
      pushLockedSubtreeError(errors, afterRef.path, "exercise");
    }
  }

  for (const [code, beforeRef] of beforeDays) {
    const afterRef = afterDays.get(code);

    if (!afterRef) {
      if (!beforeRef.editable) {
        pushLockedSubtreeError(errors, beforeRef.path, "day");
      }
      continue;
    }

    if (
      !beforeRef.editable &&
      stableJson(beforeRef.day) !== stableJson(afterRef.day)
    ) {
      pushLockedSubtreeError(errors, afterRef.path, "day");
    }
  }

  return errors;
}
