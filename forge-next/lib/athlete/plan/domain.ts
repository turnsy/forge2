import type {
  ActualSet,
  Day,
  Exercise,
  Load,
  Set,
  Week,
  WorkoutPlan,
} from "@/lib/plans/workout-plan";

export type CurrentDayLocation = {
  weekIndex: number;
  dayIndex: number;
  week: Week;
  day: Day;
};

export function findCurrentDay(plan: WorkoutPlan): CurrentDayLocation | null {
  for (const week of plan.weeks) {
    for (const day of week.days) {
      const hasIncomplete = day.exercises.some((exercise) =>
        exercise.sets.some((set) => set.status === "planned"),
      );

      if (hasIncomplete) {
        return {
          weekIndex: week.index,
          dayIndex: day.index,
          week,
          day,
        };
      }
    }
  }

  return null;
}

export function areAllDaysComplete(plan: WorkoutPlan): boolean {
  return findCurrentDay(plan) === null;
}

export function computePlanCompletionPercent(plan: WorkoutPlan): number {
  let totalDays = 0;
  let completedDays = 0;

  for (const week of plan.weeks) {
    for (const day of week.days) {
      totalDays += 1;
      const dayComplete = day.exercises.every((exercise) =>
        exercise.sets.every((set) => set.status === "completed"),
      );
      if (dayComplete) {
        completedDays += 1;
      }
    }
  }

  if (totalDays === 0) {
    return 0;
  }

  return Math.round((completedDays / totalDays) * 100);
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

  return set.actual.load !== undefined;
}

export function isExerciseComplete(exercise: Exercise): boolean {
  return exercise.sets.every((set) => isSetActualComplete(set));
}

export function dayHasUnfilledNonTargetSets(day: Day): boolean {
  return day.exercises.some((exercise) =>
    exercise.sets.some(
      (set) => set.planned.type !== "target" && !isSetActualComplete(set),
    ),
  );
}

export function parseRepsInput(value: string): number | string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  return trimmed;
}

export function parseLoadInput(
  value: string,
  plannedLoad: Load,
): Load | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (plannedLoad.type === "absolute") {
    const numeric = Number(trimmed);
    if (!Number.isFinite(numeric)) {
      return null;
    }

    return {
      type: "absolute",
      value: numeric,
      unit: plannedLoad.unit,
    };
  }

  const stripped = trimmed.replace(/%$/, "").trim();
  const numeric = Number(stripped);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return {
    ...plannedLoad,
    type: "percentage",
    value: numeric,
  };
}

export function buildActualFromInputs(
  repsInput: string,
  loadInput: string,
  set: Set,
): ActualSet | null {
  if (set.planned.type === "target") {
    return null;
  }

  const reps = parseRepsInput(repsInput);
  const load = parseLoadInput(loadInput, set.planned.load);

  if (reps === null || load === null) {
    return null;
  }

  return { reps, load };
}

export function buildActualForSave(
  repsInput: string,
  loadInput: string,
  set: Set,
): ActualSet | null {
  if (set.planned.type === "target") {
    return null;
  }

  const parsedReps = parseRepsInput(repsInput);
  const parsedLoad = parseLoadInput(loadInput, set.planned.load);
  const reps =
    parsedReps ??
    (set.actual?.reps !== undefined ? set.actual.reps : null);

  if (reps === null && parsedLoad === null) {
    return null;
  }

  if (reps === null) {
    return null;
  }

  const load = parsedLoad ?? set.actual?.load;

  return load !== undefined ? { reps, load } : { reps };
}

export function formatActualLoadInput(set: Set): string {
  if (!set.actual?.load) {
    return "";
  }

  if (set.actual.load.type === "absolute") {
    return String(set.actual.load.value);
  }

  return String(set.actual.load.value ?? "");
}

export function setFormStateFromActual(set: Set): {
  reps: string;
  load: string;
} {
  return {
    reps: set.actual?.reps !== undefined ? String(set.actual.reps) : "",
    load: formatActualLoadInput(set),
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
    load: incoming.load ?? existing.load,
    completedAt: incoming.completedAt ?? existing.completedAt,
    notes: incoming.notes ?? existing.notes,
  };
}

export function resolveSaveActual(
  repsInput: string,
  loadInput: string,
  set: Set,
): ActualSet | null | undefined {
  if (!repsInput.trim() && !loadInput.trim() && set.actual !== null) {
    return undefined;
  }

  return buildActualForSave(repsInput, loadInput, set);
}

export function applySetActuals(
  plan: WorkoutPlan,
  weekIdx: number,
  dayIdx: number,
  exerciseIdx: number,
  setIdx: number,
  actual: ActualSet | null,
): WorkoutPlan {
  return {
    ...plan,
    weeks: plan.weeks.map((week) => {
      if (week.index !== weekIdx) {
        return week;
      }

      return {
        ...week,
        days: week.days.map((day) => {
          if (day.index !== dayIdx) {
            return day;
          }

          return {
            ...day,
            exercises: day.exercises.map((exercise, currentExerciseIdx) => {
              if (currentExerciseIdx !== exerciseIdx) {
                return exercise;
              }

              return {
                ...exercise,
                sets: exercise.sets.map((set, currentSetIdx) => {
                  if (currentSetIdx !== setIdx) {
                    return set;
                  }

                  return {
                    ...set,
                    actual:
                      actual === null
                        ? null
                        : mergeSavedActual(set.actual, actual),
                  };
                }) as typeof exercise.sets,
              };
            }) as typeof day.exercises,
          };
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
  weekIdx: number,
  dayIdx: number,
): { plan: WorkoutPlan; setStatuses: { setIndex: number; status: SetCompletionStatus }[] } {
  const completedAt = new Date().toISOString();
  const setStatuses: { setIndex: number; status: SetCompletionStatus }[] = [];

  const nextPlan: WorkoutPlan = {
    ...plan,
    weeks: plan.weeks.map((week) => {
      if (week.index !== weekIdx) {
        return week;
      }

      return {
        ...week,
        days: week.days.map((day) => {
          if (day.index !== dayIdx) {
            return day;
          }

          let daySetIndex = 0;

          return {
            ...day,
            exercises: day.exercises.map((exercise) => ({
              ...exercise,
              sets: exercise.sets.map((set) => {
                const status = resolveSetCompletionStatus(set);
                setStatuses.push({ setIndex: daySetIndex, status });
                daySetIndex += 1;

                if (status === "skipped") {
                  return { ...set, status };
                }

                const actual =
                  set.planned.type === "target"
                    ? buildTargetCompletionActual(set, completedAt)
                    : set.actual
                      ? { ...set.actual, completedAt }
                      : set.actual;

                return {
                  ...set,
                  status: "completed" as const,
                  actual,
                };
              }) as typeof exercise.sets,
            })) as typeof day.exercises,
          };
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
  weekIdx: number,
  dayIdx: number,
): CurrentDayLocation | null {
  let foundCurrent = false;

  for (const week of plan.weeks) {
    for (const day of week.days) {
      if (!foundCurrent) {
        if (week.index === weekIdx && day.index === dayIdx) {
          foundCurrent = true;
        }
        continue;
      }

      const hasIncomplete = day.exercises.some((exercise) =>
        exercise.sets.some((set) => set.status === "planned"),
      );

      if (hasIncomplete) {
        return {
          weekIndex: week.index,
          dayIndex: day.index,
          week,
          day,
        };
      }
    }
  }

  return findCurrentDay(plan);
}
