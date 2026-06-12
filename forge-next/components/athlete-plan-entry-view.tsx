"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { AthletePlanCompleteView } from "@/components/athlete-plan-complete-view";
import { AthleteSkipConfirmDialog } from "@/components/athlete-skip-confirm-dialog";
import { Button, Card, Input, Message, PageHeader } from "@/components/ui";
import { completeDayAction, saveSetActualsAction } from "@/lib/athlete/plan/actions";
import { MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";
import {
  buildActualFromInputs,
  dayHasUnfilledNonTargetSets,
  isSetActualComplete,
  resolveSaveActual,
  setFormStateFromActual,
  type CurrentDayLocation,
} from "@/lib/athlete/plan/domain";
import { getDayTitle, getWeekTitle } from "@/lib/plans/display";
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

function setRowClassName(complete: boolean): string {
  return `flex items-center gap-3 rounded-xl border px-4 py-3 ${
    complete
      ? "border-emerald-500 dark:border-emerald-400"
      : "border-zinc-200 dark:border-zinc-700"
  }`;
}

function SetCheckmark({ complete }: { complete: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${
        complete
          ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-300"
          : "border-zinc-200 text-zinc-300 dark:border-zinc-700 dark:text-zinc-600"
      }`}
    >
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
  const router = useRouter();
  const [formState, setFormState] = useState<Record<string, SetFormState>>(() =>
    buildInitialFormState(currentDay.day),
  );
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [confirmSkipOpen, setConfirmSkipOpen] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
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
    setFormState(buildInitialFormState(currentDay.day));
    setSaveStatus("idle");
    setCompleteError(null);
    setConfirmSkipOpen(false);
    setShowCelebration(false);
  }, [currentDay.dayIndex, currentDay.weekIndex]);

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

  const runSave = useCallback(
    async (
      location: SetLocation,
      set: Set,
      reps: string,
      load: string,
      generation: number,
    ) => {
      const actual = resolveSaveActual(reps, load, set);
      if (actual === undefined) {
        return;
      }

      try {
        await saveSetActualsAction(
          assignmentId,
          currentDay.weekIndex,
          currentDay.dayIndex,
          location.exerciseIdx,
          location.setIdx,
          actual,
        );

        if (generation === saveGeneration.current) {
          setSaveStatus("saved");
        }
      } catch {
        if (generation === saveGeneration.current) {
          setSaveStatus("error");
        }
      }
    },
    [assignmentId, currentDay.dayIndex, currentDay.weekIndex],
  );

  const flushSaveQueue = useCallback(async () => {
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
        void flushSaveQueue();
      }
    }
  }, []);

  const scheduleSave = useCallback(
    (location: SetLocation, set: Set, reps: string, load: string) => {
      const key = getSetKey(location.exerciseIdx, location.setIdx);
      const existingTimer = debounceTimers.current[key];
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      debounceTimers.current[key] = setTimeout(() => {
        delete debounceTimers.current[key];
        saveGeneration.current += 1;
        const generation = saveGeneration.current;
        setSaveStatus("saving");

        const saveTask = () => runSave(location, set, reps, load, generation);
        queuedSave.current = saveTask;
        void flushSaveQueue();
      }, SAVE_DEBOUNCE_MS);
    },
    [flushSaveQueue, runSave],
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

    const saves: Array<Promise<void>> = [];
    currentDay.day.exercises.forEach((exercise, exerciseIdx) => {
      exercise.sets.forEach((set, setIdx) => {
        if (set.planned.type === "target") {
          return;
        }

        const local = latestFormState.current[getSetKey(exerciseIdx, setIdx)];
        if (!local) {
          return;
        }

        const actual = resolveSaveActual(local.reps, local.load, set);
        if (actual === undefined) {
          return;
        }

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

    await Promise.all(saves);
  }, [assignmentId, currentDay.day, currentDay.dayIndex, currentDay.weekIndex]);

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

        if (result.allDaysDone) {
          setShowCelebration(true);
          return;
        }

        router.refresh();
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

        if (result.allDaysDone) {
          setShowCelebration(true);
          return;
        }

        router.refresh();
      } catch {
        setCompleteError("Could not complete the day. Try again.");
        setConfirmSkipOpen(false);
      }
    });
  }

  if (showCelebration) {
    return <AthletePlanCompleteView planName={plan.name} coachName={coachName} />;
  }

  return (
    <div className={`flex flex-col gap-6 ${MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS}`}>
      <PageHeader
        title={plan.name}
        description={`${weekTitle} · ${dayTitle}`}
        actions={<SaveIndicator status={saveStatus} />}
      />

      <div className="space-y-4">
        {currentDay.day.exercises.map((exercise, exerciseIdx) => (
          <Card key={`${exercise.name}-${exerciseIdx}`} role="athlete" className="space-y-4 p-4">
            <h2 className="text-lg font-medium">{exercise.name}</h2>
            <div className="space-y-3">
              {exercise.sets.map((set, setIdx) => {
                const key = getSetKey(exerciseIdx, setIdx);
                const local = getResolvedSetFormState(formState, set, key);
                const previewActual = buildActualFromInputs(local.reps, local.load, set);
                const complete = previewActual !== null || isSetActualComplete(set);

                return (
                  <div
                    key={set.id}
                    ref={(node) => {
                      setRefs.current[key] = node;
                    }}
                    className={setRowClassName(complete)}
                  >
                    <span className="w-6 shrink-0 text-center text-sm font-medium text-zinc-500">
                      {setIdx + 1}
                    </span>
                    <SetRowInputs
                      set={set}
                      reps={local.reps}
                      load={local.load}
                      onRepsChange={(value) =>
                        handleInputChange({ exerciseIdx, setIdx }, set, "reps", value)
                      }
                      onLoadChange={(value) =>
                        handleInputChange({ exerciseIdx, setIdx }, set, "load", value)
                      }
                    />
                    <SetCheckmark complete={complete} />
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {completeError ? <Message tone="error">{completeError}</Message> : null}

      <Button
        type="button"
        disabled={completing}
        onClick={handleCompleteDay}
      >
        {completing ? "Completing…" : "Complete Day"}
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
      <p className="min-w-0 flex-1 text-sm text-zinc-700 dark:text-zinc-300">
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
      <span className="shrink-0 text-sm text-zinc-500">of</span>
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
      {unit ? <span className="shrink-0 text-sm text-zinc-500">{unit}</span> : null}
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
