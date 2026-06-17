"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useRef, type RefObject } from "react";
import { ChevronDownIcon } from "@/components/icons/chevron-down-icon";
import { ChevronUpIcon } from "@/components/icons/chevron-up-icon";
import { PlusIcon } from "@/components/icons/plus-icon";
import { XIcon } from "@/components/icons/x-icon";
import { Button, IconButton, Input } from "@/components/ui";
import { formatReps } from "@/lib/plans/display";
import type {
  AbsoluteLoad,
  Day,
  Exercise,
  ExactPlannedSet,
  Load,
  PercentageLoad,
  RepsValue,
  Set,
} from "@/lib/plans/workout-plan";
import {
  accordionContentCardClass,
  accordionNestedClass,
  controlClass,
} from "@/lib/theme";

export type PlanEditableDayProps = {
  day: Day;
  disabled: boolean;
  onChange: (day: Day) => void;
};

function cloneDayForEditing(day: Day): Day {
  return {
    ...day,
    exercises: day.exercises.map((exercise) => ({
      ...ensureExerciseId(exercise),
      sets: [...exercise.sets],
    })) as Day["exercises"],
  };
}

function createSetId(): string {
  return crypto.randomUUID();
}

function createExerciseId(): string {
  return crypto.randomUUID();
}

function ensureExerciseId(exercise: Exercise): Exercise {
  if (exercise.id) {
    return exercise;
  }

  return { ...exercise, id: createExerciseId() };
}

function parseRepsValue(value: string): RepsValue {
  if (value.trim() === "") {
    return "";
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric) && String(numeric) === value.trim()) {
    return numeric;
  }

  return value;
}

function getLoadInputValue(load: Load): string {
  if (load.type === "absolute") {
    return String(load.value);
  }

  if (load.value !== undefined) {
    return String(load.value);
  }

  return "";
}

function getLoadUnitLabel(load: Load): string {
  if (load.type === "percentage") {
    return "%";
  }

  return load.unit;
}

function updateLoadValue(load: Load, value: string): Load {
  const trimmed = value.trim();
  const numeric = trimmed === "" ? 0 : Number(trimmed);

  if (load.type === "percentage") {
    return {
      ...load,
      value: Number.isNaN(numeric) ? load.value : numeric,
    } satisfies PercentageLoad;
  }

  return {
    ...load,
    value: Number.isNaN(numeric) ? (load as AbsoluteLoad).value : numeric,
  } satisfies AbsoluteLoad;
}

function createDefaultSet(): Set {
  return {
    id: createSetId(),
    planned: {
      type: "exact",
      reps: 10,
      load: { type: "absolute", value: 0, unit: "lb" },
    },
    actual: null,
    status: "planned",
    locked: false,
  };
}

function cloneSetFromPrevious(previous: Set): Set {
  if (previous.planned.type !== "exact") {
    return createDefaultSet();
  }

  return {
    id: createSetId(),
    planned: {
      type: "exact",
      reps: previous.planned.reps,
      load: structuredClone(previous.planned.load),
      tempo: previous.planned.tempo,
      restSeconds: previous.planned.restSeconds,
      notes: previous.planned.notes,
    },
    actual: null,
    status: "planned",
    locked: false,
  };
}

export function reorderSetsInExercise(
  sets: Set[],
  activeId: string,
  overId: string | undefined,
): Set[] {
  if (!overId || activeId === overId) {
    return sets;
  }

  const oldIndex = sets.findIndex((set) => set.id === activeId);
  const newIndex = sets.findIndex((set) => set.id === overId);

  if (oldIndex === -1 || newIndex === -1) {
    return sets;
  }

  return arrayMove(sets, oldIndex, newIndex);
}

function GripIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 text-surface-muted"
      fill="currentColor"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  );
}

function SortableSetRow({
  set,
  setNumber,
  disabled,
  canDelete,
  repsInputRef,
  onRepsChange,
  onLoadChange,
  onNotesChange,
  onDelete,
}: {
  set: Set;
  setNumber: number;
  disabled: boolean;
  canDelete: boolean;
  repsInputRef?: RefObject<HTMLInputElement | null> | ((element: HTMLInputElement | null) => void);
  onRepsChange: (value: string) => void;
  onLoadChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: set.id,
      disabled,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (set.planned.type === "target") {
    return (
      <tr
        ref={setNodeRef}
        style={style}
        className={`border-b border-glass-border/60 last:border-b-0 ${
          isDragging ? "opacity-50" : ""
        }`}
      >
        <td className="px-2 py-2 text-surface-muted">⋮⋮</td>
        <td className="px-2 py-2 font-medium text-surface-foreground">{setNumber}</td>
        <td colSpan={3} className="px-2 py-2 text-sm text-surface-foreground">
          {set.planned.instruction}
        </td>
      </tr>
    );
  }

  const planned = set.planned as ExactPlannedSet;
  const notes = planned.notes ?? "";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-glass-border/60 last:border-b-0 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <td className="px-2 py-2">
        <button
          type="button"
          className={`flex items-center ${
            disabled ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
          }`}
          aria-label="Drag to reorder set"
          disabled={disabled}
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
      </td>
      <td className="px-2 py-2 font-medium text-surface-foreground">{setNumber}</td>
      <td className="px-2 py-2">
        <Input
          ref={repsInputRef}
          size="sm"
          value={formatReps(planned.reps)}
          readOnly={disabled}
          aria-label={`Set ${setNumber} reps`}
          onChange={(event) => onRepsChange(event.target.value)}
        />
      </td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1.5">
          <Input
            size="sm"
            value={getLoadInputValue(planned.load)}
            readOnly={disabled}
            aria-label={`Set ${setNumber} weight`}
            onChange={(event) => onLoadChange(event.target.value)}
            className="min-w-0 flex-1"
          />
          <span className="shrink-0 text-xs text-surface-muted">
            {getLoadUnitLabel(planned.load)}
          </span>
        </div>
      </td>
      <td className="px-2 py-2">
        <Input
          size="sm"
          value={notes}
          readOnly={disabled}
          aria-label={`Set ${setNumber} notes`}
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </td>
      <td className="px-2 py-2">
        {canDelete ? (
          <IconButton
            variant="ghost"
            size="sm"
            icon={<XIcon className="h-4 w-4" />}
            aria-label={`Delete set ${setNumber}`}
            disabled={disabled}
            onClick={onDelete}
          />
        ) : null}
      </td>
    </tr>
  );
}

function EditableExerciseBlock({
  exercise,
  exerciseIndex,
  exerciseCount,
  disabled,
  onExerciseChange,
  onDeleteExercise,
  onMoveUp,
  onMoveDown,
}: {
  exercise: Exercise;
  exerciseIndex: number;
  exerciseCount: number;
  disabled: boolean;
  onExerciseChange: (exercise: Exercise) => void;
  onDeleteExercise: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const autoFocusSetIdRef = useRef<string | null>(null);
  const dndId = useId();

  function updateSet(setIndex: number, updater: (set: Set) => Set) {
    onExerciseChange({
      ...exercise,
      sets: exercise.sets.map((set, index) =>
        index === setIndex ? updater(set) : set,
      ) as typeof exercise.sets,
    });
  }

  function handleSetDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const nextSets = reorderSetsInExercise(
      exercise.sets,
      String(active.id),
      over ? String(over.id) : undefined,
    );

    if (nextSets !== exercise.sets) {
      onExerciseChange({ ...exercise, sets: nextSets as typeof exercise.sets });
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <section className={[accordionNestedClass(), "space-y-3 p-4"].join(" ")}>
      <div className="flex items-start gap-2">
        <Input
          value={exercise.name}
          readOnly={disabled}
          aria-label="Exercise name"
          className="min-w-0 flex-1 font-semibold"
          onChange={(event) =>
            onExerciseChange({ ...exercise, name: event.target.value })
          }
        />
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            variant="ghost"
            size="sm"
            icon={<XIcon className="h-4 w-4" />}
            aria-label="Delete exercise"
            disabled={disabled}
            onClick={onDeleteExercise}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<ChevronUpIcon className="h-4 w-4" />}
            aria-label="Move exercise up"
            disabled={disabled || exerciseIndex === 0}
            onClick={onMoveUp}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<ChevronDownIcon className="h-4 w-4" />}
            aria-label="Move exercise down"
            disabled={disabled || exerciseIndex === exerciseCount - 1}
            onClick={onMoveDown}
          />
        </div>
      </div>

      <textarea
        value={exercise.notes ?? ""}
        readOnly={disabled}
        rows={1}
        placeholder="Exercise notes"
        aria-label="Exercise notes"
        className={`${controlClass("sm")} min-h-[2.25rem] w-full resize-y`}
        onChange={(event) =>
          onExerciseChange({
            ...exercise,
            notes: event.target.value || undefined,
          })
        }
      />

      <div className={accordionContentCardClass()}>
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSetDragEnd}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-glass-border text-left text-xs font-medium uppercase tracking-wide text-surface-foreground/80">
                  <th className="w-8 px-2 py-2" aria-label="Reorder" />
                  <th className="px-2 py-2 font-medium">Set</th>
                  <th className="px-2 py-2 font-medium">Reps</th>
                  <th className="px-2 py-2 font-medium">Weight</th>
                  <th className="px-2 py-2 font-medium">Notes</th>
                  <th className="w-10 px-2 py-2" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={exercise.sets.map((set) => set.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {exercise.sets.map((set, setIndex) => (
                    <SortableSetRow
                      key={set.id}
                      set={set}
                      setNumber={setIndex + 1}
                      disabled={disabled}
                      canDelete={exercise.sets.length > 1}
                      repsInputRef={(element) => {
                        if (
                          element &&
                          !disabled &&
                          autoFocusSetIdRef.current === set.id
                        ) {
                          element.focus();
                          autoFocusSetIdRef.current = null;
                        }
                      }}
                      onRepsChange={(value) => {
                        updateSet(setIndex, (current) => {
                          if (current.planned.type !== "exact") {
                            return current;
                          }

                          return {
                            ...current,
                            status: "planned",
                            planned: {
                              ...current.planned,
                              reps: parseRepsValue(value),
                            },
                          };
                        });
                      }}
                      onLoadChange={(value) => {
                        updateSet(setIndex, (current) => {
                          if (current.planned.type !== "exact") {
                            return current;
                          }

                          return {
                            ...current,
                            status: "planned",
                            planned: {
                              ...current.planned,
                              load: updateLoadValue(current.planned.load, value),
                            },
                          };
                        });
                      }}
                      onNotesChange={(value) => {
                        updateSet(setIndex, (current) => {
                          if (current.planned.type !== "exact") {
                            return current;
                          }

                          return {
                            ...current,
                            status: "planned",
                            planned: {
                              ...current.planned,
                              notes: value || undefined,
                            },
                          };
                        });
                      }}
                      onDelete={() => {
                        onExerciseChange({
                          ...exercise,
                          sets: exercise.sets.filter(
                            (_, index) => index !== setIndex,
                          ) as typeof exercise.sets,
                        });
                      }}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>
        </DndContext>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        fullWidth={false}
        icon={<PlusIcon />}
        disabled={disabled}
        onClick={() => {
          const lastSet = exercise.sets.at(-1);
          const nextSet = lastSet ? cloneSetFromPrevious(lastSet) : createDefaultSet();
          autoFocusSetIdRef.current = nextSet.id;
          onExerciseChange({
            ...exercise,
            sets: [...exercise.sets, nextSet],
          });
        }}
      >
        Set
      </Button>
    </section>
  );
}

export function PlanEditableDay({ day, disabled, onChange }: PlanEditableDayProps) {
  const editableDay = cloneDayForEditing(day);

  function emitChange(nextDay: Day) {
    onChange(nextDay);
  }

  function updateExercise(exerciseIndex: number, exercise: Exercise) {
    const nextExercises = [...editableDay.exercises];
    nextExercises[exerciseIndex] = exercise;
    emitChange({ ...editableDay, exercises: nextExercises as typeof editableDay.exercises });
  }

  function moveExercise(exerciseIndex: number, direction: -1 | 1) {
    const targetIndex = exerciseIndex + direction;
    if (targetIndex < 0 || targetIndex >= editableDay.exercises.length) {
      return;
    }

    const nextExercises = [...editableDay.exercises];
    const [moved] = nextExercises.splice(exerciseIndex, 1);
    nextExercises.splice(targetIndex, 0, moved);
    emitChange({ ...editableDay, exercises: nextExercises as typeof editableDay.exercises });
  }

  return (
    <div
      className={`space-y-6 ${disabled ? "pointer-events-none opacity-50" : ""}`}
      data-plan-editable-day
    >
      <Input
        value={editableDay.name ?? `Day ${editableDay.index}`}
        readOnly={disabled}
        aria-label="Day name"
        className="text-lg font-semibold"
        onChange={(event) =>
          emitChange({
            ...editableDay,
            name: event.target.value || undefined,
          })
        }
      />

      {editableDay.exercises.map((exercise, exerciseIndex) => (
        <EditableExerciseBlock
          key={exercise.id}
          exercise={exercise}
          exerciseIndex={exerciseIndex}
          exerciseCount={editableDay.exercises.length}
          disabled={disabled}
          onExerciseChange={(nextExercise) => updateExercise(exerciseIndex, nextExercise)}
          onDeleteExercise={() => {
            emitChange({
              ...editableDay,
              exercises: editableDay.exercises.filter(
                (_, index) => index !== exerciseIndex,
              ) as Day["exercises"],
            });
          }}
          onMoveUp={() => moveExercise(exerciseIndex, -1)}
          onMoveDown={() => moveExercise(exerciseIndex, 1)}
        />
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        fullWidth={false}
        icon={<PlusIcon />}
        disabled={disabled}
        onClick={() => {
          emitChange({
            ...editableDay,
            exercises: [
              ...editableDay.exercises,
              {
                id: createExerciseId(),
                name: "New Exercise",
                sets: [createDefaultSet()],
              },
            ],
          });
        }}
      >
        Exercise
      </Button>
    </div>
  );
}
