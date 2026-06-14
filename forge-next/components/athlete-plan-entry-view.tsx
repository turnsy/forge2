"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AthletePlanMilestoneView } from "@/components/athlete-plan-milestone-view";
import { AthleteSkipConfirmDialog } from "@/components/athlete-skip-confirm-dialog";
import { Button, Input, Message, PageHeader } from "@/components/ui";
import { completeDayAction, saveSetActualsAction, type SaveSetActualsActionResult } from "@/lib/athlete/plan/actions";
import {
  dayCompletedMilestone,
  planCompletedMilestone,
  type AthletePlanMilestone,
} from "@/lib/athlete/plan/milestones";
import { MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";
import {
  buildActualFromInputs,
  dayHasUnfilledNonTargetSets,
  isExerciseComplete,
  isSetActualComplete,
  resolveSaveActual,
  setFormStateFromActual,
  type CurrentDayLocation,
} from "@/lib/athlete/plan/domain";
import { getDayTitle, getWeekTitle } from "@/lib/plans/display";
import {
  accordionClass,
  accordionNestedClass,
  completionCheckmarkClass,
} from "@/lib/theme";
import type {
  AbsoluteLoad,
  Day,
  PercentageLoad,
  Set,
  WorkoutPlan,
} from "@/lib/plans/workout-plan";

const SAVE_DEBOUNCE_MS = 800;

type SetFormState = {
  reps: string;
  load: string;
};

type SetLocation = {
  exerciseIdx: number;
  setIdx: number;
};

function getSetKey(exerciseIdx: number, setIdx: number): string {
  return `${exerciseIdx}-${setIdx}`;
}

function buildInitialFormState(day: Day): Record<string, SetFormState> {
  const state: Record<string, SetFormState> = {};

  day.exercises.forEach((exercise, exerciseIdx) => {
    exercise.sets.forEach((set, setIdx) => {
      state[getSetKey(exerciseIdx, setIdx)] = setFormStateFromActual(set);
    });
  });

  return state;
}

function getResolvedSetFormState(
  formState: Record<string, SetFormState>,
  set: Set,
  key: string,
): SetFormState {
  return formState[key] ?? setFormStateFromActual(set);
}

function getAbsoluteUnit(set: Set): string | null {
  if (set.planned.type !== "exact" || set.planned.load.type !== "absolute") {
    return null;
  }

  return set.planned.load.unit;
}

function getPercentagePlaceholder(set: Set): string {
  if (set.planned.type !== "exact" || set.planned.load.type !== "percentage") {
    return "";
  }

  const load = set.planned.load as PercentageLoad;
  return `${load.value ?? ""}%`;
}

function getAbsoluteLoadPlaceholder(set: Set): string {
  if (set.planned.type !== "exact" || set.planned.load.type !== "absolute") {
    return "";
  }

  return String((set.planned.load as AbsoluteLoad).value);
}

function cloneDay(day: Day): Day {
  return structuredClone(day);
}

function exerciseCardClassName(complete: boolean): string {
  return [accordionNestedClass(complete ? "success" : "default"), "space-y-4"].join(" ");
}

function setRowClassName(complete: boolean): string {
  return [accordionClass(complete ? "success" : "default"), "flex items-center gap-3 !p-3"].join(
    " ",
  );
}

function SetCheckmark({ complete }: { complete: boolean }) {
  return (
    <span aria-hidden="true" className={completionCheckmarkClass(complete)}>
      ✓
    </span>
  );
}

function SaveIndicator({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
  if (status === "idle") {
    return null;
  }

  const label =
    status === "saving"
      ? "Saving..."
      : status === "saved"
        ? "Saved"
        : "Save failed";

  return (
    <span
      className={`text-xs ${
        status === "error"
          ? "text-red-600 dark:text-red-400"
          : "text-zinc-500 dark:text-zinc-400"
      }`}
      aria-live="polite"
    >
      {label}
    </span>
  );
}

export function AthletePlanEntryView({
  assignmentId,
  plan,
  currentDay,
  coachName,
}: {
  assignmentId: string;
  plan: WorkoutPlan;
  currentDay: CurrentDayLocation;
  coachName: string;
}) {
  const [formState, setFormState] = useState<Record<string, SetFormState>>(() =>
    buildInitialFormState(currentDay.day),
  );
  const [savedDay, setSavedDay] = useState<Day>(() => cloneDay(currentDay.day));
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [confirmSkipOpen, setConfirmSkipOpen] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<AthletePlanMilestone | null>(null);
  const [completing, startCompleteTransition] = useTransition();

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const saveGeneration = useRef(0);
  const inFlightSave = useRef<Promise<void> | null>(null);
  const queuedSave = useRef<(() => Promise<void>) | null>(null);
  const setRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const latestFormState = useRef(formState);

  useEffect(() => {
    latestFormState.current = formState;
  }, [formState]);

  const weekTitle = getWeekTitle(currentDay.week);
  const dayTitle = getDayTitle(currentDay.day);

  const firstIncompleteKey = useMemo(() => {
    for (let exerciseIdx = 0; exerciseIdx < currentDay.day.exercises.length; exerciseIdx += 1) {
      const exercise = currentDay.day.exercises[exerciseIdx];
      for (let setIdx = 0; setIdx < exercise.sets.length; setIdx += 1) {
        const set = exercise.sets[setIdx];
        const key = getSetKey(exerciseIdx, setIdx);
        const local = formState[key];
        const actual = local
          ? buildActualFromInputs(local.reps, local.load, set)
          : set.actual;

        if (!actual) {
          return key;
        }
      }
    }

    return null;
  }, [currentDay.day, formState]);

  useEffect(() => {
    if (!firstIncompleteKey) {
      return;
    }

    const node = setRefs.current[firstIncompleteKey];
    node?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [firstIncompleteKey, currentDay.dayIndex, currentDay.weekIndex]);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(debounceTimers.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

  const applySavedActual = useCallback(
    (location: SetLocation, actual: Set["actual"]) => {
      setSavedDay((previous) => {
        const next = cloneDay(previous);
        next.exercises[location.exerciseIdx].sets[location.setIdx] = {
          ...next.exercises[location.exerciseIdx].sets[location.setIdx],
          actual,
        };
        return next;
      });
    },
    [],
  );

  const runSave = useCallback(
    async (location: SetLocation, set: Set, reps: string, load: string) => {
      const resolution = resolveSaveActual(reps, load, set);
      if (resolution.type === "skip") {
        return;
      }

      const { actual } = resolution;
      saveGeneration.current += 1;
      const generation = saveGeneration.current;
      setSaveStatus("saving");

      const result = await saveSetActualsAction(
        assignmentId,
        currentDay.weekIndex,
        currentDay.dayIndex,
        location.exerciseIdx,
        location.setIdx,
        actual,
      );

      if (!result.ok) {
        if (generation === saveGeneration.current) {
          setSaveStatus("error");
        }
        return;
      }

      applySavedActual(location, actual);

      if (generation === saveGeneration.current) {
        setSaveStatus("saved");
      }
    },
    [
      applySavedActual,
      assignmentId,
      currentDay.dayIndex,
      currentDay.weekIndex,
    ],
  );

  async function flushSaveQueue(): Promise<void> {
    if (inFlightSave.current) {
      return;
    }

    const next = queuedSave.current;
    if (!next) {
      return;
    }

    queuedSave.current = null;
    inFlightSave.current = next();

    try {
      await inFlightSave.current;
    } finally {
      inFlightSave.current = null;
      if (queuedSave.current) {
        await flushSaveQueue();
      }
    }
  }

  const scheduleSave = useCallback(
    (location: SetLocation, set: Set, reps: string, load: string) => {
      const key = getSetKey(location.exerciseIdx, location.setIdx);
      const existingTimer = debounceTimers.current[key];
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      debounceTimers.current[key] = setTimeout(() => {
        delete debounceTimers.current[key];

        const saveTask = () => runSave(location, set, reps, load);
        queuedSave.current = saveTask;
        void flushSaveQueue();
      }, SAVE_DEBOUNCE_MS);
    },
    [runSave],
  );

  function handleInputChange(
    location: SetLocation,
    set: Set,
    field: "reps" | "load",
    value: string,
  ) {
    const key = getSetKey(location.exerciseIdx, location.setIdx);
    setFormState((previous) => {
      const current = previous[key] ?? { reps: "", load: "" };
      const next = { ...current, [field]: value };
      scheduleSave(location, set, next.reps, next.load);
      return { ...previous, [key]: next };
    });
  }

  const flushPendingSaves = useCallback(async () => {
    for (const timer of Object.values(debounceTimers.current)) {
      clearTimeout(timer);
    }
    debounceTimers.current = {};
    queuedSave.current = null;

    if (inFlightSave.current) {
      await inFlightSave.current.catch(() => undefined);
      inFlightSave.current = null;
    }

    const saves: Array<Promise<SaveSetActualsActionResult>> = [];
    const savedUpdates: Array<{ location: SetLocation; actual: Set["actual"] }> = [];
    currentDay.day.exercises.forEach((exercise, exerciseIdx) => {
      exercise.sets.forEach((set, setIdx) => {
        if (set.planned.type === "target") {
          return;
        }

        const local = latestFormState.current[getSetKey(exerciseIdx, setIdx)];
        if (!local) {
          return;
        }

        const resolution = resolveSaveActual(local.reps, local.load, set);
        if (resolution.type === "skip") {
          return;
        }

        const { actual } = resolution;
        const location = { exerciseIdx, setIdx };
        savedUpdates.push({ location, actual });
        saves.push(
          saveSetActualsAction(
            assignmentId,
            currentDay.weekIndex,
            currentDay.dayIndex,
            exerciseIdx,
            setIdx,
            actual,
          ),
        );
      });
    });

    const results = await Promise.all(saves);
    if (results.some((result) => !result.ok)) {
      throw new Error("Failed to save set actuals");
    }

    if (savedUpdates.length > 0) {
      setSavedDay((previous) => {
        const next = cloneDay(previous);
        for (const { location, actual } of savedUpdates) {
          next.exercises[location.exerciseIdx].sets[location.setIdx] = {
            ...next.exercises[location.exerciseIdx].sets[location.setIdx],
            actual,
          };
        }
        return next;
      });
    }
  }, [assignmentId, currentDay.day, currentDay.dayIndex, currentDay.weekIndex]);

  function handleCompleteSuccess(allDaysDone: boolean) {
    if (allDaysDone) {
      setMilestone(planCompletedMilestone(plan, coachName));
      return;
    }

    setMilestone(dayCompletedMilestone(currentDay));
  }

  function handleCompleteDay() {
    setCompleteError(null);

    const dayWithLocalActuals = applyLocalActualsToDay(
      currentDay.day,
      latestFormState.current,
    );
    if (dayHasUnfilledNonTargetSets(dayWithLocalActuals)) {
      setConfirmSkipOpen(true);
      return;
    }

    startCompleteTransition(async () => {
      try {
        await flushPendingSaves();
        const result = await completeDayAction(
          assignmentId,
          currentDay.weekIndex,
          currentDay.dayIndex,
        );

        if (!result.ok) {
          setCompleteError("Could not complete the day. Try again.");
          return;
        }

        handleCompleteSuccess(result.allDaysDone);
      } catch {
        setCompleteError("Could not complete the day. Try again.");
      }
    });
  }

  function handleConfirmSkip() {
    startCompleteTransition(async () => {
      try {
        await flushPendingSaves();
        const result = await completeDayAction(
          assignmentId,
          currentDay.weekIndex,
          currentDay.dayIndex,
        );
        setConfirmSkipOpen(false);

        if (!result.ok) {
          setCompleteError("Could not complete the day. Try again.");
          return;
        }

        handleCompleteSuccess(result.allDaysDone);
      } catch {
        setCompleteError("Could not complete the day. Try again.");
        setConfirmSkipOpen(false);
      }
    });
  }

  if (milestone) {
    return <AthletePlanMilestoneView milestone={milestone} />;
  }

  return (
    <div className={`flex flex-col gap-6 ${MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS}`}>
      <PageHeader
        title={plan.name}
        description={`${weekTitle} · ${dayTitle}`}
        actions={<SaveIndicator status={saveStatus} />}
      />

      <div className="space-y-4">
        {savedDay.exercises.map((exercise, exerciseIdx) => {
          const exerciseComplete = isExerciseComplete(exercise);

          return (
            <section
              key={`${exercise.name}-${exerciseIdx}`}
              className={exerciseCardClassName(exerciseComplete)}
              data-exercise-complete={exerciseComplete ? "true" : "false"}
            >
              <h2 className="text-base font-semibold text-surface-foreground">
                {exercise.name}
              </h2>
              <div className="space-y-3">
                {exercise.sets.map((savedSet, setIdx) => {
                  const key = getSetKey(exerciseIdx, setIdx);
                  const local = getResolvedSetFormState(
                    formState,
                    currentDay.day.exercises[exerciseIdx].sets[setIdx],
                    key,
                  );
                  const complete = isSetActualComplete(savedSet);

                  return (
                    <div
                      key={savedSet.id}
                      ref={(node) => {
                        setRefs.current[key] = node;
                      }}
                      className={setRowClassName(complete)}
                      data-set-complete={complete ? "true" : "false"}
                    >
                      <span className="w-6 shrink-0 text-center text-sm font-medium text-surface-muted">
                        {setIdx + 1}
                      </span>
                      <SetRowInputs
                        set={currentDay.day.exercises[exerciseIdx].sets[setIdx]}
                        reps={local.reps}
                        load={local.load}
                        onRepsChange={(value) =>
                          handleInputChange(
                            { exerciseIdx, setIdx },
                            currentDay.day.exercises[exerciseIdx].sets[setIdx],
                            "reps",
                            value,
                          )
                        }
                        onLoadChange={(value) =>
                          handleInputChange(
                            { exerciseIdx, setIdx },
                            currentDay.day.exercises[exerciseIdx].sets[setIdx],
                            "load",
                            value,
                          )
                        }
                      />
                      <SetCheckmark complete={complete} />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {completeError ? <Message tone="error">{completeError}</Message> : null}

      <Button
        type="button"
        disabled={completing}
        onClick={handleCompleteDay}
      >
        {completing ? "Completing…" : "Complete"}
      </Button>

      <AthleteSkipConfirmDialog
        open={confirmSkipOpen}
        pending={completing}
        onCancel={() => setConfirmSkipOpen(false)}
        onConfirm={handleConfirmSkip}
      />
    </div>
  );
}

function SetRowInputs({
  set,
  reps,
  load,
  onRepsChange,
  onLoadChange,
}: {
  set: Set;
  reps: string;
  load: string;
  onRepsChange: (value: string) => void;
  onLoadChange: (value: string) => void;
}) {
  if (set.planned.type === "target") {
    return (
      <p className="min-w-0 flex-1 text-sm text-surface-muted">
        {set.planned.instruction}
      </p>
    );
  }

  const unit = getAbsoluteUnit(set);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Input
        aria-label="Set reps"
        type="text"
        value={reps}
        placeholder={String(set.planned.reps)}
        onChange={(event) => onRepsChange(event.target.value)}
        className="w-16"
        size="sm"
      />
      <span className="shrink-0 text-sm text-surface-muted">of</span>
      <Input
        aria-label="Set load"
        type="text"
        value={load}
        placeholder={
          set.planned.load.type === "percentage"
            ? getPercentagePlaceholder(set)
            : getAbsoluteLoadPlaceholder(set)
        }
        onChange={(event) => onLoadChange(event.target.value)}
        className="w-16"
        size="sm"
      />
      {unit ? <span className="shrink-0 text-sm text-surface-muted">{unit}</span> : null}
    </div>
  );
}

function applyLocalActualsToDay(
  day: Day,
  formState: Record<string, SetFormState>,
): Day {
  return {
    ...day,
    exercises: day.exercises.map((exercise, exerciseIdx) => ({
      ...exercise,
      sets: exercise.sets.map((set, setIdx) => {
        const local = formState[getSetKey(exerciseIdx, setIdx)];
        if (!local) {
          return set;
        }

        const actual = buildActualFromInputs(local.reps, local.load, set);
        return {
          ...set,
          actual: actual ?? set.actual,
        };
      }) as typeof exercise.sets,
    })) as typeof day.exercises,
  };
}
