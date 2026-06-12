import type {
  ActualSet,
  Day,
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

export function isSetActualComplete(set: Set): boolean {
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
                    actual,
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
                    ? (set.actual ?? {
                        reps: set.planned.reps ?? 1,
                        completedAt,
                      })
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
