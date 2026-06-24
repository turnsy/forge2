"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AthleteSkipConfirmDialog } from "@/components/athlete-skip-confirm-dialog";
import { VideoIcon } from "@/components/icons/video-icon";
import { PlanBlockSection } from "@/components/plan/plan-block-section";
import { CoachEditableDayView } from "@/components/plan/coach-editable-day-view";
import { CoachLockedDayView } from "@/components/plan/coach-locked-day-view";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import { Button, IconButton, Input, Message } from "@/components/ui";
import { completeDayAction, saveSetActualsAction, type SaveSetActualsActionResult } from "@/lib/athlete/plan/actions";
import {
  buildActualFromInputs,
  dayHasUnfilledNonTargetSets,
  isExerciseComplete,
  isSetActualComplete,
  resolveSaveActual,
  setFormStateFromActual,
} from "@/lib/athlete/plan/domain";
import {
  applyLocalActualsToDay,
  cloneDay,
  flattenDayExercises,
  getFlatExercisePos,
  getFlattenedExerciseRefs,
  isSupersetBlock,
  updateFlattenedSet,
} from "@/lib/plans/day-blocks";
import { getDayTitle, getSetNotes } from "@/lib/plans/display";
import { isDayEditable, resolveDayLocation } from "@/lib/plans/plan-day-navigator";
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
  target: string;
};

type SetLocation = {
  exercisePos: number;
  setPos: number;
};

export type PlanDayViewProps = {
  plan: WorkoutPlan | null;
  weekPos: number;
  dayPos: number;
  view: PlanViewerView;
  readOnly?: boolean;
  assignmentId?: string;
  coachName?: string;
  onDayCompleted?: (allDaysDone: boolean, plan: WorkoutPlan) => void;
  onSaveStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void;
  onPlanChange?: (plan: WorkoutPlan) => void;
  disabled?: boolean;
};

function getSetKey(exercisePos: number, setPos: number): string {
  return `${exercisePos}-${setPos}`;
}

function buildInitialFormState(day: Day): Record<string, SetFormState> {
  const state: Record<string, SetFormState> = {};

  getFlattenedExerciseRefs(day).forEach((ref, exercisePos) => {
    ref.exercise.sets.forEach((set, setPos) => {
      state[getSetKey(exercisePos, setPos)] = setFormStateFromActual(set);
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

function getTargetUnitLabel(set: Set): string | null {
  if (set.planned.type !== "exact") {
    return null;
  }

  return set.planned.target.unit;
}

function getPercentagePlaceholder(set: Set): string {
  if (set.planned.type !== "exact" || set.planned.target.type !== "percentage") {
    return "";
  }

  const load = set.planned.target as PercentageLoad;
  return `${load.value}%`;
}

function getAbsoluteLoadPlaceholder(set: Set): string {
  if (set.planned.type !== "exact" || set.planned.target.type !== "absolute") {
    return "";
  }

  return String((set.planned.target as AbsoluteLoad).value);
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

function applyLocalActualsToDayForm(
  day: Day,
  formState: Record<string, SetFormState>,
): Day {
  return applyLocalActualsToDay(day, formState, getSetKey, buildActualFromInputs);
}

function SetRowInputs({
  set,
  reps,
  target,
  onRepsChange,
  onTargetChange,
  readOnly = false,
}: {
  set: Set;
  reps: string;
  target: string;
  onRepsChange?: (value: string) => void;
  onTargetChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  if (set.planned.type === "target") {
    return (
      <p className="min-w-0 flex-1 text-sm text-surface-muted">
        {set.planned.instruction}
      </p>
    );
  }

  const unit = getTargetUnitLabel(set);

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
        aria-label="Set target"
        type="text"
        value={target}
        placeholder={
          set.planned.target.type === "percentage"
            ? getPercentagePlaceholder(set)
            : getAbsoluteLoadPlaceholder(set)
        }
        readOnly={readOnly}
        onChange={
          readOnly ? undefined : (event) => onTargetChange?.(event.target.value)
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

function AthleteExerciseHeader({
  name,
  videoUrl,
}: {
  name: string;
  videoUrl?: string;
}) {
  if (!videoUrl) {
    return (
      <h2 className="text-base font-semibold text-surface-foreground">{name}</h2>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-base font-semibold text-surface-foreground">{name}</h2>
      <IconButton
        variant="ghost"
        size="sm"
        icon={<VideoIcon className="h-4 w-4" />}
        aria-label="Watch exercise video"
        onClick={() => window.open(videoUrl, "_blank", "noopener,noreferrer")}
      />
    </div>
  );
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
  target,
  readOnly,
  complete,
  setRef,
  onRepsChange,
  onTargetChange,
}: {
  set: Set;
  setIdx: number;
  reps: string;
  target: string;
  readOnly?: boolean;
  complete?: boolean;
  setRef?: (node: HTMLDivElement | null) => void;
  onRepsChange?: (value: string) => void;
  onTargetChange?: (value: string) => void;
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
          target={target}
          readOnly={readOnly}
          onRepsChange={onRepsChange}
          onTargetChange={onTargetChange}
        />
        <SetCheckmark complete={Boolean(complete)} />
      </div>
    </div>
  );
}

function AthleteReadOnlyDayContent({ day, dayPos }: { day: Day; dayPos: number }) {
  return (
    <div className="space-y-4">
      <PlanDayHeader day={day} dayPos={dayPos} />
      {day.blocks.map((block) => (
        <section
          key={block.id}
          className={
            isSupersetBlock(block)
              ? "space-y-4 rounded-lg border border-glass-border/80 bg-glass/30 p-4"
              : "space-y-4"
          }
        >
          {isSupersetBlock(block) ? (
            <span className="rounded-full border border-glass-border/80 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-surface-muted">
              Superset
            </span>
          ) : null}
          {block.exercises.map((exercise, exercisePosInBlock) => (
            <div key={`${block.id}-${exercise.id}-${exercisePosInBlock}`} className="space-y-4">
              <AthleteExerciseHeader name={exercise.name} videoUrl={exercise.videoUrl} />
              <AthleteExerciseNotes notes={exercise.notes} />
              <div className="space-y-3">
                {exercise.sets.map((set, setIdx) => {
                  const filled = set.status === "completed";
                  const values = filled ? setFormStateFromActual(set) : { reps: "", target: "" };

                  return (
                    <AthleteSetRow
                      key={set.id}
                      set={set}
                      setIdx={setIdx}
                      reps={values.reps}
                      target={values.target}
                      readOnly
                      complete={filled}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function PlanDayHeader({ day, dayPos }: { day: Day; dayPos: number }) {
  return (
    <h2 className="text-lg font-semibold text-surface-foreground">{getDayTitle(day, dayPos)}</h2>
  );
}

function CoachDayContent({ day, dayPos }: { day: Day; dayPos: number }) {
  return (
    <div className="space-y-6">
      <PlanDayHeader day={day} dayPos={dayPos} />
      {day.blocks.map((block) => (
        <PlanBlockSection
          key={block.id}
          block={block}
          dayCode={day.code}
          view="coach"
          surfaceVariant="default"
        />
      ))}
    </div>
  );
}

function AthleteEditableDayContent({
  day,
  weekPos,
  dayPos,
  assignmentId,
  onDayCompleted,
  onSaveStatusChange,
}: {
  day: Day;
  weekPos: number;
  dayPos: number;
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
    const refs = getFlattenedExerciseRefs(day);
    for (let exercisePos = 0; exercisePos < refs.length; exercisePos += 1) {
      const exercise = refs[exercisePos].exercise;
      for (let setPos = 0; setPos < exercise.sets.length; setPos += 1) {
        const set = exercise.sets[setPos];
        const key = getSetKey(exercisePos, setPos);
        const local = formState[key];
        const actual = local
          ? buildActualFromInputs(local.reps, local.target, set)
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
  }, [firstIncompleteKey, weekPos, dayPos]);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(debounceTimers.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

  const applySavedActual = useCallback((location: SetLocation, actual: Set["actual"]) => {
    setSavedDay((previous) =>
      updateFlattenedSet(previous, location.exercisePos, location.setPos, (set) => ({
        ...set,
        actual,
      })),
    );
  }, []);

  const runSave = useCallback(
    async (location: SetLocation, set: Set, reps: string, target: string) => {
      const resolution = resolveSaveActual(reps, target, set);
      if (resolution.type === "skip") {
        return;
      }

      const { actual } = resolution;
      saveGeneration.current += 1;
      const generation = saveGeneration.current;
      setSaveStatus("saving");

      const result = await saveSetActualsAction(
        assignmentId,
        weekPos,
        dayPos,
        location.exercisePos,
        location.setPos,
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
    [applySavedActual, assignmentId, dayPos, weekPos],
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
    target: string,
  ) {
    const key = getSetKey(location.exercisePos, location.setPos);
    const existingTimer = debounceTimers.current[key];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    debounceTimers.current[key] = setTimeout(() => {
      delete debounceTimers.current[key];

      const saveTask = () => runSave(location, set, reps, target);
      queuedSave.current = saveTask;
      void flushSaveQueue();
    }, SAVE_DEBOUNCE_MS);
  }

  function handleInputChange(
    location: SetLocation,
    set: Set,
    field: "reps" | "target",
    value: string,
  ) {
    const key = getSetKey(location.exercisePos, location.setPos);
    setFormState((previous) => {
      const current = previous[key] ?? { reps: "", target: "" };
      const next = { ...current, [field]: value };
      scheduleSave(location, set, next.reps, next.target);
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
    getFlattenedExerciseRefs(day).forEach((ref, exercisePos) => {
      ref.exercise.sets.forEach((set, setPos) => {
        if (set.planned.type === "target") {
          return;
        }

        const local = latestFormState.current[getSetKey(exercisePos, setPos)];
        if (!local) {
          return;
        }

        const resolution = resolveSaveActual(local.reps, local.target, set);
        if (resolution.type === "skip") {
          return;
        }

        const { actual } = resolution;
        const location = { exercisePos, setPos };
        savedUpdates.push({ location, actual });
        saves.push(
          saveSetActualsAction(
            assignmentId,
            weekPos,
            dayPos,
            exercisePos,
            setPos,
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
        let next = previous;
        for (const { location, actual } of savedUpdates) {
          next = updateFlattenedSet(next, location.exercisePos, location.setPos, (set) => ({
            ...set,
            actual,
          }));
        }
        return next;
      });
    }
  }, [assignmentId, day, dayPos, weekPos]);

  function handleCompleteSuccess(allDaysDone: boolean, plan: WorkoutPlan) {
    onDayCompleted?.(allDaysDone, plan);
  }

  function handleCompleteDay() {
    setCompleteError(null);

    const dayWithLocalActuals = applyLocalActualsToDayForm(day, latestFormState.current);
    if (dayHasUnfilledNonTargetSets(dayWithLocalActuals)) {
      setConfirmSkipOpen(true);
      return;
    }

    startCompleteTransition(async () => {
      try {
        await flushPendingSaves();
        const result = await completeDayAction(assignmentId, weekPos, dayPos);

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
        const result = await completeDayAction(assignmentId, weekPos, dayPos);
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
      <PlanDayHeader day={day} dayPos={dayPos} />
      <div className="space-y-4">
        {savedDay.blocks.map((block, blockPos) => (
          <section
            key={block.id}
            className={
              isSupersetBlock(block)
                ? "space-y-4 rounded-lg border border-glass-border/80 bg-glass/30 p-4"
                : "space-y-4"
            }
          >
            {isSupersetBlock(block) ? (
              <span className="rounded-full border border-glass-border/80 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-surface-muted">
                Superset
              </span>
            ) : null}
            {block.exercises.map((exercise, exercisePosInBlock) => {
              const exercisePos = getFlatExercisePos(savedDay, blockPos, exercisePosInBlock);
              const plannedExercise = day.blocks[blockPos]?.exercises[exercisePosInBlock];
              const exerciseComplete = isExerciseComplete(exercise);

              if (!plannedExercise) {
                return null;
              }

              return (
                <section
                  key={`${block.id}-${exercise.id}`}
                  className={exerciseCardClassName(exerciseComplete)}
                  data-exercise-complete={exerciseComplete ? "true" : "false"}
                >
                  <AthleteExerciseHeader name={exercise.name} videoUrl={exercise.videoUrl} />
                  <AthleteExerciseNotes notes={exercise.notes} />
                  <div className="space-y-3">
                    {exercise.sets.map((savedSet, setPos) => {
                      const key = getSetKey(exercisePos, setPos);
                      const local = getResolvedSetFormState(
                        formState,
                        plannedExercise.sets[setPos],
                        key,
                      );
                      const complete = isSetActualComplete(savedSet);

                      return (
                        <AthleteSetRow
                          key={savedSet.id}
                          set={plannedExercise.sets[setPos]}
                          setIdx={setPos}
                          reps={local.reps}
                          target={local.target}
                          complete={complete}
                          setRef={(node) => {
                            setRefs.current[key] = node;
                          }}
                          onRepsChange={(value) =>
                            handleInputChange(
                              { exercisePos, setPos },
                              plannedExercise.sets[setPos],
                              "reps",
                              value,
                            )
                          }
                          onTargetChange={(value) =>
                            handleInputChange(
                              { exercisePos, setPos },
                              plannedExercise.sets[setPos],
                              "target",
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
          </section>
        ))}
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
  weekPos,
  dayPos,
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

  const location = resolveDayLocation(plan, weekPos, dayPos);
  if (!location) {
    return <p className="text-sm text-surface-muted">Day not found</p>;
  }

  const { day } = location;

  if (view === "athlete" && assignmentId) {
    if (!readOnly && isDayEditable(day)) {
      return (
        <AthleteEditableDayContent
          key={`${weekPos}-${dayPos}`}
          day={day}
          weekPos={weekPos}
          dayPos={dayPos}
          assignmentId={assignmentId}
          onDayCompleted={onDayCompleted}
          onSaveStatusChange={onSaveStatusChange}
        />
      );
    }

    return <AthleteReadOnlyDayContent day={day} dayPos={dayPos} />;
  }

  if (view === "coach" && !readOnly && onPlanChange && plan) {
    if (!isDayEditable(day)) {
      return <CoachLockedDayView day={day} dayPos={dayPos} />;
    }

    return (
      <CoachEditableDayView
        plan={plan}
        weekPos={weekPos}
        dayPos={dayPos}
        disabled={disabled}
        onPlanChange={onPlanChange}
      />
    );
  }

  return <CoachDayContent day={day} dayPos={dayPos} />;
}
