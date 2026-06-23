"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AthleteSkipConfirmDialog } from "@/components/athlete-skip-confirm-dialog";
import { VideoIcon } from "@/components/icons/video-icon";
import { PlanExerciseBlock } from "@/components/plan/plan-exercise-block";
import { CoachEditableDayView } from "@/components/plan/coach-editable-day-view";
import { CoachLockedDayView } from "@/components/plan/coach-locked-day-view";
import { PlanSupersetBlock } from "@/components/plan/plan-superset-block";
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
  getDayBlocks,
  getSetKey,
  isExerciseBlock,
  migrateDayToBlocks,
  type SetLocation,
} from "@/lib/plans/day-blocks";
import { isDayEditable, resolveDayLocation } from "@/lib/plans/plan-day-navigator";
import { getDayTitle, getSetNotes } from "@/lib/plans/display";
import type {
  AbsoluteLoad,
  Day,
  PercentageLoad,
  Set,
  SupersetGroup,
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

function buildInitialFormState(day: Day): Record<string, SetFormState> {
  const state: Record<string, SetFormState> = {};
  const normalized = migrateDayToBlocks(day);

  normalized.blocks.forEach((block, blockIdx) => {
    const exercises = isExerciseBlock(block) ? [block.exercise] : block.exercises;
    exercises.forEach((exercise, exerciseIdx) => {
      exercise.sets.forEach((set, setIdx) => {
        state[getSetKey(blockIdx, exerciseIdx, setIdx)] = setFormStateFromActual(set);
      });
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
  return structuredClone(migrateDayToBlocks(day));
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
  const normalized = migrateDayToBlocks(day);

  return {
    ...normalized,
    blocks: normalized.blocks.map((block, blockIdx) => {
      if (isExerciseBlock(block)) {
        return {
          ...block,
          exercise: {
            ...block.exercise,
            sets: block.exercise.sets.map((set, setIdx) => {
              const local = formState[getSetKey(blockIdx, 0, setIdx)];
              if (!local) {
                return set;
              }

              const actual = buildActualFromInputs(local.reps, local.load, set);
              return {
                ...set,
                actual: actual ?? set.actual,
              };
            }) as typeof block.exercise.sets,
          },
        };
      }

      return {
        ...block,
        exercises: block.exercises.map((exercise, exerciseIdx) => ({
          ...exercise,
          sets: exercise.sets.map((set, setIdx) => {
            const local = formState[getSetKey(blockIdx, exerciseIdx, setIdx)];
            if (!local) {
              return set;
            }

            const actual = buildActualFromInputs(local.reps, local.load, set);
            return {
              ...set,
              actual: actual ?? set.actual,
            };
          }) as typeof exercise.sets,
        })) as typeof block.exercises,
      };
    }) as typeof normalized.blocks,
  };
}

export function SetRowInputs({
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

function AthleteSupersetRoundRow({
  roundNumber,
  exercises,
  blockIdx,
  roundIdx,
  formState,
  savedSets,
  sourceSets,
  readOnly,
  setRefs,
  onInputChange,
}: {
  roundNumber: number;
  exercises: SupersetGroup["exercises"];
  blockIdx: number;
  roundIdx: number;
  formState: Record<string, SetFormState>;
  savedSets: SupersetGroup["exercises"];
  sourceSets: SupersetGroup["exercises"];
  readOnly?: boolean;
  setRefs?: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onInputChange?: (
    location: SetLocation,
    set: Set,
    field: "reps" | "load",
    value: string,
  ) => void;
}) {
  return (
    <div
      className={[
        accordionClass("default"),
        "space-y-3 !p-3",
      ].join(" ")}
      data-superset-round={roundNumber}
    >
      <p className="text-sm font-medium text-surface-muted">Round {roundNumber}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {exercises.map((exercise, exerciseIdx) => {
          const set = sourceSets[exerciseIdx].sets[roundIdx];
          const savedSet = savedSets[exerciseIdx].sets[roundIdx];
          const key = getSetKey(blockIdx, exerciseIdx, roundIdx);
          const local = getResolvedSetFormState(formState, set, key);
          const complete = isSetActualComplete(savedSet);

          return (
            <div key={`${exercise.name}-${exerciseIdx}`} className="space-y-2">
              <AthleteExerciseHeader name={exercise.name} videoUrl={exercise.videoUrl} />
              <div
                ref={setRefs ? (node) => { setRefs.current[key] = node; } : undefined}
                className={
                  readOnly
                    ? athleteReadOnlySetCardClassName(savedSet)
                    : athleteSetCardClassName(complete)
                }
                data-set-complete={complete ? "true" : "false"}
              >
                <AthleteSetNotes notes={getSetNotes(set)} />
                <SetRowInputs
                  set={set}
                  reps={local.reps}
                  load={local.load}
                  readOnly={readOnly}
                  onRepsChange={
                    readOnly
                      ? undefined
                      : (value) => onInputChange?.({ blockIdx, exerciseIdx, setIdx: roundIdx }, set, "reps", value)
                  }
                  onLoadChange={
                    readOnly
                      ? undefined
                      : (value) => onInputChange?.({ blockIdx, exerciseIdx, setIdx: roundIdx }, set, "load", value)
                  }
                />
                {!readOnly ? <SetCheckmark complete={complete} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AthleteSupersetSection({
  superset,
  blockIdx,
  savedSuperset,
  sourceSuperset,
  formState,
  readOnly,
  setRefs,
  onInputChange,
}: {
  superset: SupersetGroup;
  blockIdx: number;
  savedSuperset: SupersetGroup;
  sourceSuperset: SupersetGroup;
  formState: Record<string, SetFormState>;
  readOnly?: boolean;
  setRefs?: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onInputChange?: (
    location: SetLocation,
    set: Set,
    field: "reps" | "load",
    value: string,
  ) => void;
}) {
  const roundCount = superset.exercises[0]?.sets.length ?? 0;
  const supersetComplete = superset.exercises.every((exercise) => isExerciseComplete(exercise));

  return (
    <section
      className={[exerciseCardClassName(supersetComplete), "border border-glass-border"].join(" ")}
      data-superset-block
      data-exercise-complete={supersetComplete ? "true" : "false"}
    >
      <div>
        <h2 className="text-base font-semibold text-surface-foreground">Superset</h2>
        {superset.notes ? (
          <p className="mt-1 text-sm text-surface-muted">{superset.notes}</p>
        ) : null}
      </div>
      <div className="space-y-3">
        {Array.from({ length: roundCount }, (_, roundIdx) => (
          <AthleteSupersetRoundRow
            key={`round-${roundIdx}`}
            roundNumber={roundIdx + 1}
            exercises={superset.exercises}
            blockIdx={blockIdx}
            roundIdx={roundIdx}
            formState={formState}
            savedSets={savedSuperset.exercises}
            sourceSets={sourceSuperset.exercises}
            readOnly={readOnly}
            setRefs={setRefs}
            onInputChange={onInputChange}
          />
        ))}
      </div>
    </section>
  );
}

function AthleteReadOnlyDayContent({ day }: { day: Day }) {
  const blocks = getDayBlocks(day);

  return (
    <div className="space-y-4">
      <PlanDayHeader day={day} />
      {blocks.map((block, blockIdx) => {
        if (isExerciseBlock(block)) {
          const exercise = block.exercise;
          return (
            <section
              key={`${exercise.name}-${blockIdx}`}
              className={[accordionNestedClass("default"), "space-y-4"].join(" ")}
            >
              <AthleteExerciseHeader name={exercise.name} videoUrl={exercise.videoUrl} />
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
          );
        }

        return (
          <AthleteSupersetSection
            key={`superset-${blockIdx}`}
            superset={block}
            blockIdx={blockIdx}
            savedSuperset={block}
            sourceSuperset={block}
            formState={{}}
            readOnly
          />
        );
      })}
    </div>
  );
}

function PlanDayHeader({ day }: { day: Day }) {
  return (
    <h2 className="text-lg font-semibold text-surface-foreground">{getDayTitle(day)}</h2>
  );
}

function CoachDayContent({ day }: { day: Day }) {
  const blocks = getDayBlocks(day);

  return (
    <div className="space-y-6">
      <PlanDayHeader day={day} />
      {blocks.map((block, index) => {
        if (isExerciseBlock(block)) {
          return (
            <PlanExerciseBlock
              key={`${day.code}-${block.exercise.id ?? block.exercise.name}-${index}`}
              exercise={block.exercise}
              view="coach"
              surfaceVariant="default"
            />
          );
        }

        return (
          <PlanSupersetBlock
            key={`${day.code}-superset-${index}`}
            superset={block}
            view="coach"
          />
        );
      })}
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
  const normalizedDay = migrateDayToBlocks(day);
  const [formState, setFormState] = useState<Record<string, SetFormState>>(() =>
    buildInitialFormState(normalizedDay),
  );
  const [savedDay, setSavedDay] = useState<Day>(() => cloneDay(normalizedDay));
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
    for (let blockIdx = 0; blockIdx < normalizedDay.blocks.length; blockIdx += 1) {
      const block = normalizedDay.blocks[blockIdx];
      const exercises = isExerciseBlock(block) ? [block.exercise] : block.exercises;

      for (let exerciseIdx = 0; exerciseIdx < exercises.length; exerciseIdx += 1) {
        const exercise = exercises[exerciseIdx];
        for (let setIdx = 0; setIdx < exercise.sets.length; setIdx += 1) {
          const set = exercise.sets[setIdx];
          const key = getSetKey(blockIdx, exerciseIdx, setIdx);
          const local = formState[key];
          const actual = local
            ? buildActualFromInputs(local.reps, local.load, set)
            : set.actual;

          if (!actual) {
            return key;
          }
        }
      }
    }

    return null;
  }, [normalizedDay, formState]);

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
      const block = next.blocks[location.blockIdx];

      if (isExerciseBlock(block)) {
        block.exercise.sets[location.setIdx] = {
          ...block.exercise.sets[location.setIdx],
          actual,
        };
        return next;
      }

      block.exercises[location.exerciseIdx].sets[location.setIdx] = {
        ...block.exercises[location.exerciseIdx].sets[location.setIdx],
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
        location.blockIdx,
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
    const key = getSetKey(location.blockIdx, location.exerciseIdx, location.setIdx);
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
    const key = getSetKey(location.blockIdx, location.exerciseIdx, location.setIdx);
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

    normalizedDay.blocks.forEach((block, blockIdx) => {
      const exercises = isExerciseBlock(block) ? [block.exercise] : block.exercises;

      exercises.forEach((exercise, exerciseIdx) => {
        exercise.sets.forEach((set, setIdx) => {
          if (set.planned.type === "target") {
            return;
          }

          const local = latestFormState.current[getSetKey(blockIdx, exerciseIdx, setIdx)];
          if (!local) {
            return;
          }

          const resolution = resolveSaveActual(local.reps, local.load, set);
          if (resolution.type === "skip") {
            return;
          }

          const { actual } = resolution;
          const location = { blockIdx, exerciseIdx, setIdx };
          savedUpdates.push({ location, actual });
          saves.push(
            saveSetActualsAction(
              assignmentId,
              weekIndex,
              dayIndex,
              blockIdx,
              exerciseIdx,
              setIdx,
              actual,
            ),
          );
        });
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
          const block = next.blocks[location.blockIdx];
          if (isExerciseBlock(block)) {
            block.exercise.sets[location.setIdx] = {
              ...block.exercise.sets[location.setIdx],
              actual,
            };
          } else {
            block.exercises[location.exerciseIdx].sets[location.setIdx] = {
              ...block.exercises[location.exerciseIdx].sets[location.setIdx],
              actual,
            };
          }
        }
        return next;
      });
    }
  }, [assignmentId, normalizedDay, dayIndex, weekIndex]);

  function handleCompleteSuccess(allDaysDone: boolean, plan: WorkoutPlan) {
    onDayCompleted?.(allDaysDone, plan);
  }

  function handleCompleteDay() {
    setCompleteError(null);

    const dayWithLocalActuals = applyLocalActualsToDay(normalizedDay, latestFormState.current);
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
      <PlanDayHeader day={normalizedDay} />
      <div className="space-y-4">
        {savedDay.blocks.map((savedBlock, blockIdx) => {
          const sourceBlock = normalizedDay.blocks[blockIdx];

          if (isExerciseBlock(savedBlock) && isExerciseBlock(sourceBlock)) {
            const exercise = savedBlock.exercise;
            const exerciseComplete = isExerciseComplete(exercise);

            return (
              <section
                key={`${exercise.name}-${blockIdx}`}
                className={exerciseCardClassName(exerciseComplete)}
                data-exercise-complete={exerciseComplete ? "true" : "false"}
              >
                <AthleteExerciseHeader name={exercise.name} videoUrl={exercise.videoUrl} />
                <AthleteExerciseNotes notes={exercise.notes} />
                <div className="space-y-3">
                  {exercise.sets.map((savedSet, setIdx) => {
                    const key = getSetKey(blockIdx, 0, setIdx);
                    const local = getResolvedSetFormState(
                      formState,
                      sourceBlock.exercise.sets[setIdx],
                      key,
                    );
                    const complete = isSetActualComplete(savedSet);

                    return (
                      <AthleteSetRow
                        key={savedSet.id}
                        set={sourceBlock.exercise.sets[setIdx]}
                        setIdx={setIdx}
                        reps={local.reps}
                        load={local.load}
                        complete={complete}
                        setRef={(node) => {
                          setRefs.current[key] = node;
                        }}
                        onRepsChange={(value) =>
                          handleInputChange(
                            { blockIdx, exerciseIdx: 0, setIdx },
                            sourceBlock.exercise.sets[setIdx],
                            "reps",
                            value,
                          )
                        }
                        onLoadChange={(value) =>
                          handleInputChange(
                            { blockIdx, exerciseIdx: 0, setIdx },
                            sourceBlock.exercise.sets[setIdx],
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
          }

          if (!isExerciseBlock(savedBlock) && !isExerciseBlock(sourceBlock)) {
            return (
              <AthleteSupersetSection
                key={`superset-${blockIdx}`}
                superset={savedBlock}
                blockIdx={blockIdx}
                savedSuperset={savedBlock}
                sourceSuperset={sourceBlock}
                formState={formState}
                setRefs={setRefs}
                onInputChange={handleInputChange}
              />
            );
          }

          return null;
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
