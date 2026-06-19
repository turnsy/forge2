"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AthleteSkipConfirmDialog } from "@/components/athlete-skip-confirm-dialog";
import { PlanExerciseBlock } from "@/components/plan/plan-exercise-block";
import { CoachEditableDayView } from "@/components/plan/coach-editable-day-view";
import { CoachLockedDayView } from "@/components/plan/coach-locked-day-view";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import { Button, Input, Message } from "@/components/ui";
import { completeDayAction, saveSetActualsAction, type SaveSetActualsActionResult } from "@/lib/athlete/plan/actions";
import {
  buildActualFromInputs,
  dayHasUnfilledNonTargetSets,
  isExerciseComplete,
  isSetActualComplete,
  resolveSaveActual,
  setFormStateFromActual,
} from "@/lib/athlete/plan/domain";
import { isDayEditable, resolveDayLocation } from "@/lib/plans/plan-day-navigator";
import { getDayTitle, getSetNotes } from "@/lib/plans/display";
import type {
  AbsoluteLoad,
  Day,
  PercentageLoad,
  Set,
  WorkoutPlan,
} from "@/lib/plans/workout-plan";
import {
  accordionClass,
  accordionNestedClass,
  completionCheckmarkClass,
} from "@/lib/theme";

const SAVE_DEBOUNCE_MS = 800;
const COMPLETE_DAY_ERROR = "Could not complete the day. Try again.";

type SetFormState = {
  reps: string;
  load: string;
};

type SetLocation = {
  exerciseIdx: number;
  setIdx: number;
};

export type PlanDayViewProps = {
  plan: WorkoutPlan | null;
  weekIndex: number;
  dayIndex: number;
  view: PlanViewerView;
  readOnly?: boolean;
  assignmentId?: string;
  coachName?: string;
  onDayCompleted?: (allDaysDone: boolean, plan: WorkoutPlan) => void;
  onSaveStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void;
  onPlanChange?: (plan: WorkoutPlan) => void;
  disabled?: boolean;
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

function getLoadUnitLabel(set: Set): string | null {
  if (set.planned.type !== "exact") {
    return null;
  }

  return set.planned.load.unit;
}

function getPercentagePlaceholder(set: Set): string {
  if (set.planned.type !== "exact" || set.planned.load.type !== "percentage") {
    return "";
  }

  const load = set.planned.load as PercentageLoad;
  return `${load.value}%`;
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

function athleteSetCardClassName(complete: boolean): string {
  return [accordionClass(complete ? "success" : "default"), "space-y-2 !p-3"].join(" ");
}

function athleteReadOnlySetCardClassName(set: Set): string {
  if (set.status === "skipped") {
    return [
      accordionClass("default"),
      "space-y-2 !p-3",
      "border-orange-500/35 bg-orange-500/10",
    ].join(" ");
  }

  return athleteSetCardClassName(set.status === "completed" || isSetActualComplete(set));
}

function SetCheckmark({ complete }: { complete: boolean }) {
  return (
    <span aria-hidden="true" className={completionCheckmarkClass(complete)}>
      ✓
    </span>
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

function SetRowInputs({
  set,
  reps,
  load,
  onRepsChange,
  onLoadChange,
  readOnly = false,
}: {
  set: Set;
  reps: string;
  load: string;
  onRepsChange?: (value: string) => void;
  onLoadChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  if (set.planned.type === "target") {
    return (
      <p className="min-w-0 flex-1 text-sm text-surface-muted">
        {set.planned.instruction}
      </p>
    );
  }

  const unit = getLoadUnitLabel(set);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <Input
        aria-label="Set reps"
        type="text"
        value={reps}
        placeholder={String(set.planned.reps)}
        readOnly={readOnly}
        onChange={
          readOnly ? undefined : (event) => onRepsChange?.(event.target.value)
        }
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
        readOnly={readOnly}
        onChange={
          readOnly ? undefined : (event) => onLoadChange?.(event.target.value)
        }
        className="w-16"
        size="sm"
      />
      {unit ? <span className="shrink-0 text-sm text-surface-muted">{unit}</span> : null}
    </div>
  );
}

function AthleteExerciseNotes({ notes }: { notes?: string }) {
  if (!notes?.trim()) {
    return null;
  }

  return <p className="text-sm text-surface-muted">{notes.trim()}</p>;
}

function AthleteSetNotes({ notes }: { notes?: string }) {
  if (!notes) {
    return null;
  }

  return <p className="text-sm text-surface-muted">{notes}</p>;
}

function AthleteSetRow({
  set,
  setIdx,
  reps,
  load,
  readOnly,
  complete,
  setRef,
  onRepsChange,
  onLoadChange,
}: {
  set: Set;
  setIdx: number;
  reps: string;
  load: string;
  readOnly?: boolean;
  complete?: boolean;
  setRef?: (node: HTMLDivElement | null) => void;
  onRepsChange?: (value: string) => void;
  onLoadChange?: (value: string) => void;
}) {
  const notes = getSetNotes(set);

  return (
    <div
      ref={setRef}
      className={
        readOnly
          ? athleteReadOnlySetCardClassName(set)
          : athleteSetCardClassName(Boolean(complete))
      }
      data-set-status={readOnly ? set.status : undefined}
      data-set-complete={complete ? "true" : "false"}
    >
      <AthleteSetNotes notes={notes} />
      <div className="flex items-center gap-3">
        <span className="w-6 shrink-0 text-center text-sm font-medium text-surface-muted">
          {setIdx + 1}
        </span>
        <SetRowInputs
          set={set}
          reps={reps}
          load={load}
          readOnly={readOnly}
          onRepsChange={onRepsChange}
          onLoadChange={onLoadChange}
        />
        <SetCheckmark complete={Boolean(complete)} />
      </div>
    </div>
  );
}

function AthleteReadOnlyDayContent({ day }: { day: Day }) {
  return (
    <div className="space-y-4">
      <PlanDayHeader day={day} />
      {day.exercises.map((exercise, exerciseIdx) => (
        <section
          key={`${exercise.name}-${exerciseIdx}`}
          className={[accordionNestedClass("default"), "space-y-4"].join(" ")}
        >
          <h2 className="text-base font-semibold text-surface-foreground">
            {exercise.name}
          </h2>
          <AthleteExerciseNotes notes={exercise.notes} />
          <div className="space-y-3">
            {exercise.sets.map((set, setIdx) => {
              const filled = set.status === "completed";
              const values = filled ? setFormStateFromActual(set) : { reps: "", load: "" };

              return (
                <AthleteSetRow
                  key={set.id}
                  set={set}
                  setIdx={setIdx}
                  reps={values.reps}
                  load={values.load}
                  readOnly
                  complete={filled}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function PlanDayHeader({ day }: { day: Day }) {
  return (
    <h2 className="text-lg font-semibold text-surface-foreground">{getDayTitle(day)}</h2>
  );
}

function CoachDayContent({ day }: { day: Day }) {
  return (
    <div className="space-y-6">
      <PlanDayHeader day={day} />
      {day.exercises.map((exercise, index) => (
        <PlanExerciseBlock
          key={`${day.code}-${exercise.id ?? exercise.name}-${index}`}
          exercise={exercise}
          view="coach"
          surfaceVariant="default"
        />
      ))}
    </div>
  );
}

function AthleteEditableDayContent({
  day,
  weekIndex,
  dayIndex,
  assignmentId,
  onDayCompleted,
  onSaveStatusChange,
}: {
  day: Day;
  weekIndex: number;
  dayIndex: number;
  assignmentId: string;
  onDayCompleted?: (allDaysDone: boolean, plan: WorkoutPlan) => void;
  onSaveStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void;
}) {
  const [formState, setFormState] = useState<Record<string, SetFormState>>(() =>
    buildInitialFormState(day),
  );
  const [savedDay, setSavedDay] = useState<Day>(() => cloneDay(day));
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirmSkipOpen, setConfirmSkipOpen] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
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

  useEffect(() => {
    onSaveStatusChange?.(saveStatus);
  }, [onSaveStatusChange, saveStatus]);

  const firstIncompleteKey = useMemo(() => {
    for (let exerciseIdx = 0; exerciseIdx < day.exercises.length; exerciseIdx += 1) {
      const exercise = day.exercises[exerciseIdx];
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
  }, [day, formState]);

  useEffect(() => {
    if (!firstIncompleteKey) {
      return;
    }

    const node = setRefs.current[firstIncompleteKey];
    node?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [firstIncompleteKey, weekIndex, dayIndex]);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(debounceTimers.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

  const applySavedActual = useCallback((location: SetLocation, actual: Set["actual"]) => {
    setSavedDay((previous) => {
      const next = cloneDay(previous);
      next.exercises[location.exerciseIdx].sets[location.setIdx] = {
        ...next.exercises[location.exerciseIdx].sets[location.setIdx],
        actual,
      };
      return next;
    });
  }, []);

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
        weekIndex,
        dayIndex,
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
    [applySavedActual, assignmentId, dayIndex, weekIndex],
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

  function scheduleSave(
    location: SetLocation,
    set: Set,
    reps: string,
    load: string,
  ) {
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
  }

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
    day.exercises.forEach((exercise, exerciseIdx) => {
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
            weekIndex,
            dayIndex,
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
  }, [assignmentId, day, dayIndex, weekIndex]);

  function handleCompleteSuccess(allDaysDone: boolean, plan: WorkoutPlan) {
    onDayCompleted?.(allDaysDone, plan);
  }

  function handleCompleteDay() {
    setCompleteError(null);

    const dayWithLocalActuals = applyLocalActualsToDay(day, latestFormState.current);
    if (dayHasUnfilledNonTargetSets(dayWithLocalActuals)) {
      setConfirmSkipOpen(true);
      return;
    }

    startCompleteTransition(async () => {
      try {
        await flushPendingSaves();
        const result = await completeDayAction(assignmentId, weekIndex, dayIndex);

        if (!result.ok) {
          setCompleteError(COMPLETE_DAY_ERROR);
          return;
        }

        handleCompleteSuccess(result.allDaysDone, result.plan);
      } catch {
        setCompleteError(COMPLETE_DAY_ERROR);
      }
    });
  }

  function handleConfirmSkip() {
    startCompleteTransition(async () => {
      try {
        await flushPendingSaves();
        const result = await completeDayAction(assignmentId, weekIndex, dayIndex);
        setConfirmSkipOpen(false);

        if (!result.ok) {
          setCompleteError(COMPLETE_DAY_ERROR);
          return;
        }

        handleCompleteSuccess(result.allDaysDone, result.plan);
      } catch {
        setCompleteError(COMPLETE_DAY_ERROR);
        setConfirmSkipOpen(false);
      }
    });
  }

  return (
    <>
      <PlanDayHeader day={day} />
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
              <AthleteExerciseNotes notes={exercise.notes} />
              <div className="space-y-3">
                {exercise.sets.map((savedSet, setIdx) => {
                  const key = getSetKey(exerciseIdx, setIdx);
                  const local = getResolvedSetFormState(
                    formState,
                    day.exercises[exerciseIdx].sets[setIdx],
                    key,
                  );
                  const complete = isSetActualComplete(savedSet);

                  return (
                    <AthleteSetRow
                      key={savedSet.id}
                      set={day.exercises[exerciseIdx].sets[setIdx]}
                      setIdx={setIdx}
                      reps={local.reps}
                      load={local.load}
                      complete={complete}
                      setRef={(node) => {
                        setRefs.current[key] = node;
                      }}
                      onRepsChange={(value) =>
                        handleInputChange(
                          { exerciseIdx, setIdx },
                          day.exercises[exerciseIdx].sets[setIdx],
                          "reps",
                          value,
                        )
                      }
                      onLoadChange={(value) =>
                        handleInputChange(
                          { exerciseIdx, setIdx },
                          day.exercises[exerciseIdx].sets[setIdx],
                          "load",
                          value,
                        )
                      }
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {completeError ? <Message tone="error">{completeError}</Message> : null}

      <Button type="button" disabled={completing} onClick={handleCompleteDay}>
        {completing ? "Completing…" : "Complete"}
      </Button>

      <AthleteSkipConfirmDialog
        open={confirmSkipOpen}
        pending={completing}
        onCancel={() => setConfirmSkipOpen(false)}
        onConfirm={handleConfirmSkip}
      />
    </>
  );
}

export function PlanDayView({
  plan,
  weekIndex,
  dayIndex,
  view,
  readOnly = false,
  assignmentId,
  onDayCompleted,
  onSaveStatusChange,
  onPlanChange,
  disabled = false,
}: PlanDayViewProps) {
  if (!plan) {
    return <p className="text-sm text-surface-muted">Day not found</p>;
  }

  const location = resolveDayLocation(plan, weekIndex, dayIndex);
  if (!location) {
    return <p className="text-sm text-surface-muted">Day not found</p>;
  }

  const { day } = location;

  if (view === "athlete" && assignmentId) {
    if (!readOnly && isDayEditable(day)) {
      return (
        <AthleteEditableDayContent
          key={`${weekIndex}-${dayIndex}`}
          day={day}
          weekIndex={weekIndex}
          dayIndex={dayIndex}
          assignmentId={assignmentId}
          onDayCompleted={onDayCompleted}
          onSaveStatusChange={onSaveStatusChange}
        />
      );
    }

    return <AthleteReadOnlyDayContent day={day} />;
  }

  if (view === "coach" && !readOnly && onPlanChange && plan) {
    if (!isDayEditable(day)) {
      return <CoachLockedDayView day={day} />;
    }

    return (
      <CoachEditableDayView
        plan={plan}
        weekIndex={weekIndex}
        dayIndex={dayIndex}
        disabled={disabled}
        onPlanChange={onPlanChange}
      />
    );
  }

  return <CoachDayContent day={day} />;
}
