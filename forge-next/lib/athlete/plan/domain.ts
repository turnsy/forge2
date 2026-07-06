import {
  flattenDayExercises,
  mapDayBlocks,
  updateFlattenedSet,
} from "@/lib/plans/day-blocks";
import { parseRepsInput } from "@/lib/plans/parse-reps";
import type {
  ActualSet,
  Day,
  Exercise,
  SetTarget,
  Set,
  Week,
  WorkoutPlan,
} from "@/lib/plans/workout-plan";

export type CurrentDayLocation = {
  weekPos: number;
  dayPos: number;
  week: Week;
  day: Day;
};

export function findCurrentDay(plan: WorkoutPlan): CurrentDayLocation | null {
  for (let weekPos = 0; weekPos < plan.weeks.length; weekPos += 1) {
    const week = plan.weeks[weekPos];
    for (let dayPos = 0; dayPos < week.days.length; dayPos += 1) {
      const day = week.days[dayPos];
      const hasIncomplete = flattenDayExercises(day).some((exercise) =>
        exercise.sets.some((set) => set.status === "planned"),
      );

      if (hasIncomplete) {
        return { weekPos, dayPos, week, day };
      }
    }
  }

  return null;
}

export function areAllDaysComplete(plan: WorkoutPlan): boolean {
  return findCurrentDay(plan) === null;
}

/** True when every set on the day is completed or skipped (no planned sets remain). */
export function isDayResolved(day: Day): boolean {
  const exercises = flattenDayExercises(day);
  if (exercises.length === 0) {
    return false;
  }

  return exercises.every((exercise) =>
    exercise.sets.every((set) => set.status !== "planned"),
  );
}

/** True when every set on the day is skipped. */
export function isDayFullySkipped(day: Day): boolean {
  const exercises = flattenDayExercises(day);
  if (exercises.length === 0) {
    return false;
  }

  return exercises.every((exercise) =>
    exercise.sets.every((set) => set.status === "skipped"),
  );
}

/** True when the day has at least one skipped set. */
export function dayHasSkippedSets(day: Day): boolean {
  return flattenDayExercises(day).some((exercise) =>
    exercise.sets.some((set) => set.status === "skipped"),
  );
}

export function countFullySkippedDays(plan: WorkoutPlan): number {
  let count = 0;

  for (const week of plan.weeks) {
    for (const day of week.days ?? []) {
      if (isDayFullySkipped(day)) {
        count += 1;
      }
    }
  }

  return count;
}

export function computePlanCompletionPercent(plan: WorkoutPlan): number {
  let totalDays = 0;
  let resolvedDays = 0;

  for (const week of plan.weeks) {
    for (const day of week.days) {
      totalDays += 1;
      if (isDayResolved(day)) {
        resolvedDays += 1;
      }
    }
  }

  if (totalDays === 0) {
    return 0;
  }

  return Math.round((resolvedDays / totalDays) * 100);
}

export function isSetActualComplete(set: Set): boolean {
  if (set.status === "skipped") {
    return true;
  }

  if (set.planned.type === "target") {
    return set.actual !== null;
  }

  if (!set.actual) {
    return false;
  }

  const reps = set.actual.reps;
  if (reps === "" || reps === null || reps === undefined) {
    return false;
  }

  return set.actual.target !== undefined;
}

export function isExerciseComplete(exercise: Exercise): boolean {
  return exercise.sets.every((set) => isSetActualComplete(set));
}

export function dayHasUnfilledNonTargetSets(day: Day): boolean {
  return flattenDayExercises(day).some((exercise) =>
    exercise.sets.some(
      (set) => set.planned.type !== "target" && !isSetActualComplete(set),
    ),
  );
}

export function parseTargetInput(
  value: string,
  plannedTarget: SetTarget,
): SetTarget | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const unit = plannedTarget.unit;

  if (plannedTarget.type === "absolute") {
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      return null;
    }

    return {
      type: "absolute",
      value: numeric,
      unit,
    };
  }

  const hasPercentSuffix = trimmed.endsWith("%");
  const stripped = hasPercentSuffix ? trimmed.slice(0, -1).trim() : trimmed;
  const numeric = Number(stripped);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  if (hasPercentSuffix) {
    return {
      type: "percentage",
      value: numeric,
      unit,
    };
  }

  return {
    type: "absolute",
    value: numeric,
    unit,
  };
}

export function buildActualFromInputs(
  repsInput: string,
  targetInput: string,
  set: Set,
): ActualSet | null {
  if (set.planned.type === "target") {
    return null;
  }

  const reps = parseRepsInput(repsInput);
  const parsedTarget = parseTargetInput(targetInput, set.planned.target);

  if (reps === null || parsedTarget === null) {
    return null;
  }

  return { reps, target: parsedTarget };
}

export function buildActualForSave(
  repsInput: string,
  targetInput: string,
  set: Set,
): ActualSet | null {
  if (set.planned.type === "target") {
    return null;
  }

  const parsedReps = parseRepsInput(repsInput);
  const parsedTarget = parseTargetInput(targetInput, set.planned.target);
  const reps =
    parsedReps ??
    (set.actual?.reps !== undefined ? set.actual.reps : null);

  if (reps === null && parsedTarget === null) {
    return null;
  }

  if (reps === null) {
    return null;
  }

  const target = parsedTarget ?? set.actual?.target;

  return target !== undefined ? { reps, target } : { reps };
}

export function formatActualTargetInput(set: Set): string {
  if (!set.actual?.target) {
    return "";
  }

  if (set.actual.target.type === "absolute") {
    return String(set.actual.target.value);
  }

  return String(set.actual.target.value ?? "");
}

export function setFormStateFromActual(set: Set): {
  reps: string;
  target: string;
} {
  return {
    reps: set.actual?.reps !== undefined ? String(set.actual.reps) : "",
    target: formatActualTargetInput(set),
  };
}

export function mergeSavedActual(
  existing: ActualSet | null,
  incoming: ActualSet,
): ActualSet {
  if (!existing) {
    return incoming;
  }

  return {
    reps: incoming.reps ?? existing.reps,
    target: incoming.target ?? existing.target,
    completedAt: incoming.completedAt ?? existing.completedAt,
    notes: incoming.notes ?? existing.notes,
  };
}

export type ResolveSaveActualResult =
  | { type: "save"; actual: ActualSet | null }
  | { type: "skip" };

export function resolveSaveActual(
  repsInput: string,
  targetInput: string,
  set: Set,
): ResolveSaveActualResult {
  if (!repsInput.trim() && !targetInput.trim() && set.actual !== null) {
    return { type: "skip" };
  }

  return { type: "save", actual: buildActualForSave(repsInput, targetInput, set) };
}

export function applySetActuals(
  plan: WorkoutPlan,
  weekPos: number,
  dayPos: number,
  exercisePos: number,
  setPos: number,
  actual: ActualSet | null,
): WorkoutPlan {
  return {
    ...plan,
    weeks: plan.weeks.map((week, currentWeekPos) => {
      if (currentWeekPos !== weekPos) {
        return week;
      }

      return {
        ...week,
        days: week.days.map((day, currentDayPos) => {
          if (currentDayPos !== dayPos) {
            return day;
          }

          return updateFlattenedSet(day, exercisePos, setPos, (set) => ({
            ...set,
            actual:
              actual === null ? null : mergeSavedActual(set.actual, actual),
          }));
        }) as typeof week.days,
      };
    }) as typeof plan.weeks,
  };
}

export type SetCompletionStatus = "completed" | "skipped";

function buildTargetCompletionActual(set: Set, completedAt: string): ActualSet {
  if (set.actual) {
    return { ...set.actual, completedAt };
  }

  if (set.planned.type === "target" && set.planned.reps !== undefined) {
    return { reps: set.planned.reps, completedAt };
  }

  return { completedAt };
}

export function completeDayInPlan(
  plan: WorkoutPlan,
  weekPos: number,
  dayPos: number,
): { plan: WorkoutPlan; setStatuses: { setIndex: number; status: SetCompletionStatus }[] } {
  const completedAt = new Date().toISOString();
  const setStatuses: { setIndex: number; status: SetCompletionStatus }[] = [];

  const nextPlan: WorkoutPlan = {
    ...plan,
    weeks: plan.weeks.map((week, currentWeekPos) => {
      if (currentWeekPos !== weekPos) {
        return week;
      }

      return {
        ...week,
        days: week.days.map((day, currentDayPos) => {
          if (currentDayPos !== dayPos) {
            return day;
          }

          let daySetIndex = 0;

          return mapDayBlocks(day, (block) => ({
            ...block,
            exercises: block.exercises.map((exercise) => ({
              ...exercise,
              sets: exercise.sets.map((set) => {
                const status = resolveSetCompletionStatus(set);
                setStatuses.push({ setIndex: daySetIndex, status });
                daySetIndex += 1;

                if (status === "skipped") {
                  return { ...set, status };
                }

                const nextActual =
                  set.planned.type === "target"
                    ? buildTargetCompletionActual(set, completedAt)
                    : set.actual
                      ? { ...set.actual, completedAt }
                      : set.actual;

                return {
                  ...set,
                  status: "completed" as const,
                  actual: nextActual,
                };
              }) as typeof exercise.sets,
            })) as typeof block.exercises,
          }));
        }) as typeof week.days,
      };
    }) as typeof plan.weeks,
  };

  return { plan: nextPlan, setStatuses };
}

function resolveSetCompletionStatus(set: Set): SetCompletionStatus {
  if (set.planned.type === "target") {
    return "completed";
  }

  if (isSetActualComplete(set)) {
    return "completed";
  }

  return "skipped";
}

export function findNextDayAfter(
  plan: WorkoutPlan,
  weekPos: number,
  dayPos: number,
): CurrentDayLocation | null {
  let foundCurrent = false;

  for (let currentWeekPos = 0; currentWeekPos < plan.weeks.length; currentWeekPos += 1) {
    const week = plan.weeks[currentWeekPos];
    for (let currentDayPos = 0; currentDayPos < week.days.length; currentDayPos += 1) {
      const day = week.days[currentDayPos];
      if (!foundCurrent) {
        if (currentWeekPos === weekPos && currentDayPos === dayPos) {
          foundCurrent = true;
        }
        continue;
      }

      const hasIncomplete = flattenDayExercises(day).some((exercise) =>
        exercise.sets.some((set) => set.status === "planned"),
      );

      if (hasIncomplete) {
        return {
          weekPos: currentWeekPos,
          dayPos: currentDayPos,
          week,
          day,
        };
      }
    }
  }

  return findCurrentDay(plan);
}

export { parseRepsInput };
