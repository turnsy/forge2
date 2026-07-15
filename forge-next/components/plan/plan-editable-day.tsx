"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useRef, type RefObject } from "react";
import { ChevronDownIcon } from "@/components/icons/chevron-down-icon";
import { ChevronUpIcon } from "@/components/icons/chevron-up-icon";
import { PlusIcon } from "@/components/icons/plus-icon";
import { VideoIcon } from "@/components/icons/video-icon";
import { XIcon } from "@/components/icons/x-icon";
import { Button, IconButton, Input } from "@/components/ui";
import { BlockHeader } from "@/components/plan/block-header";
import { PlanLoadTargetControl } from "@/components/plan/plan-load-target-control";
import { PlanExerciseBlock } from "@/components/plan/plan-exercise-block";
import { ExerciseResolutionControls } from "@/components/plan/exercise-resolution-controls";
import { athleteExerciseCardClassName } from "@/components/plan/plan-athlete-parts";
import { formatReps } from "@/lib/plans/display";
import { parseRepsValue } from "@/lib/plans/parse-reps";
import { reorderSetsInExercise } from "@/lib/plans/reorder-sets";
import {
  createDefaultBlock,
  createDefaultExercise,
  createDefaultSet,
  createDefaultSupersetBlock,
  createExerciseId,
  createSetId,
} from "@/lib/plans/plan-defaults";
import { createBlockId, isSupersetBlock } from "@/lib/plans/day-blocks";
import type {
  Day,
  Exercise,
  ExactPlannedSet,
  SetTarget,
  Set,
} from "@/lib/plans/workout-plan";
import {
  accordionContentCardClass,
  accordionNestedClass,
  controlClass,
} from "@/lib/theme";

export type PlanEditableDayProps = {
  day: Day;
  dayPos: number;
  disabled: boolean;
  onChange: (day: Day) => void;
  isSetEditable?: (set: Set) => boolean;
  isExerciseEditable?: (exercise: Exercise) => boolean;
  onNeedVideoLink?: (
    blockPos: number,
    exercisePosInBlock: number,
    exerciseName: string,
    currentVideoUrl?: string,
  ) => void;
};

function cloneDayForEditing(day: Day): Day {
  return {
    ...day,
    blocks: day.blocks.map((block) => ({
      ...block,
      exercises: block.exercises.map((exercise) => ({
        ...ensureExerciseId(exercise),
        sets: [...exercise.sets],
      })) as typeof block.exercises,
    })) as Day["blocks"],
  };
}

function ensureExerciseId(exercise: Exercise): Exercise {
  if (exercise.id) {
    return exercise;
  }

  return { ...exercise, id: createExerciseId() };
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
      target: structuredClone(previous.planned.target),
      tempo: previous.planned.tempo,
      restSeconds: previous.planned.restSeconds,
      notes: previous.planned.notes,
    },
    actual: null,
    status: "planned",
    locked: false,
  };
}

const mobileFieldLabelClass =
  "mb-1 block text-xs font-medium uppercase tracking-wide text-surface-muted md:hidden";

function MobileFieldLabel({ children }: { children: string }) {
  return <span className={mobileFieldLabelClass}>{children}</span>;
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
  setEditable,
  canDelete,
  repsInputRef,
  onRepsChange,
  onTargetUpdate,
  onNotesChange,
  onDelete,
}: {
  set: Set;
  setNumber: number;
  disabled: boolean;
  setEditable: boolean;
  canDelete: boolean;
  repsInputRef?: RefObject<HTMLInputElement | null> | ((element: HTMLInputElement | null) => void);
  onRepsChange: (value: string) => void;
  onTargetUpdate: (load: SetTarget) => void;
  onNotesChange: (value: string) => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: set.id,
      disabled: disabled || !setEditable,
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
        <td colSpan={4} className="px-2 py-2 text-sm text-surface-foreground">
          {set.planned.instruction}
        </td>
      </tr>
    );
  }

  const planned = set.planned as ExactPlannedSet;
  const notes = planned.notes ?? "";
  const rowDisabled = disabled || !setEditable;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-glass-border/60 last:border-b-0 max-md:mb-3 max-md:grid max-md:grid-cols-[auto_1fr_auto] max-md:gap-x-2 max-md:gap-y-2.5 max-md:rounded-lg max-md:border max-md:p-3 max-md:last:mb-0 max-md:last:border-b ${
        isDragging ? "opacity-50" : ""
      } ${!setEditable ? "bg-zinc-100/60 dark:bg-zinc-800/40" : ""}`}
      data-set-editable={setEditable ? "true" : "false"}
    >
      <td className="px-2 py-2 max-md:col-start-1 max-md:row-start-1 max-md:p-0">
        <button
          type="button"
          className={`flex items-center ${
            rowDisabled || !setEditable
              ? "cursor-not-allowed"
              : "cursor-grab active:cursor-grabbing"
          }`}
          aria-label="Drag to reorder set"
          disabled={rowDisabled || !setEditable}
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
      </td>
      <td className="px-2 py-2 max-md:col-span-3 max-md:col-start-1 max-md:row-start-2 max-md:p-0">
        <MobileFieldLabel>Reps</MobileFieldLabel>
        <Input
          ref={repsInputRef}
          size="sm"
          value={formatReps(planned.reps)}
          readOnly={rowDisabled}
          aria-label={`Set ${setNumber} reps`}
          className="w-full"
          onChange={(event) => onRepsChange(event.target.value)}
        />
      </td>
      <td className="px-2 py-2 max-md:col-span-3 max-md:col-start-1 max-md:row-start-3 max-md:p-0">
        <MobileFieldLabel>Target</MobileFieldLabel>
        <PlanLoadTargetControl
          target={planned.target}
          disabled={rowDisabled}
          setNumber={setNumber}
          onChange={onTargetUpdate}
        />
      </td>
      <td className="px-2 py-2 max-md:col-span-3 max-md:col-start-1 max-md:row-start-4 max-md:p-0">
        <MobileFieldLabel>Notes</MobileFieldLabel>
        <Input
          size="sm"
          value={notes}
          readOnly={rowDisabled}
          aria-label={`Set ${setNumber} notes`}
          className="w-full"
          onChange={(event) => onNotesChange(event.target.value)}
        />
      </td>
      <td className="px-2 py-2 max-md:col-start-3 max-md:row-start-1 max-md:flex max-md:justify-end max-md:p-0">
        {canDelete ? (
          <IconButton
            variant="danger"
            size="sm"
            icon={<XIcon className="h-4 w-4" />}
            aria-label={`Delete set ${setNumber}`}
            disabled={rowDisabled}
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
  isSetEditable,
  isExerciseEditable,
  onExerciseChange,
  onDeleteExercise,
  onMoveUp,
  onMoveDown,
  onNeedVideoLink,
}: {
  exercise: Exercise;
  exerciseIndex: number;
  exerciseCount: number;
  disabled: boolean;
  isSetEditable: (set: Set) => boolean;
  isExerciseEditable: boolean;
  onExerciseChange: (exercise: Exercise) => void;
  onDeleteExercise: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onNeedVideoLink?: () => void;
}) {
  const autoFocusSetIdRef = useRef<string | null>(null);
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (!isExerciseEditable) {
    return (
      <section
        className={[accordionNestedClass(), "space-y-3 bg-zinc-100/60 p-4 dark:bg-zinc-800/40"].join(
          " ",
        )}
        data-exercise-editable="false"
      >
        <PlanExerciseBlock exercise={exercise} view="coach" />
      </section>
    );
  }

  const editableSets = exercise.sets.filter(isSetEditable);

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
    const activeId = String(active.id);
    const overId = over ? String(over.id) : undefined;

    if (!isSetEditable(exercise.sets.find((set) => set.id === activeId)!)) {
      return;
    }

    const nextSets = reorderSetsInExercise(exercise.sets, activeId, overId);

    if (nextSets !== exercise.sets) {
      onExerciseChange({ ...exercise, sets: nextSets as typeof exercise.sets });
    }
  }

  return (
    <section className={[accordionNestedClass(), "space-y-3 p-4"].join(" ")} data-exercise-editable="true">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <ExerciseResolutionControls
            exercise={exercise}
            disabled={disabled}
            onChange={onExerciseChange}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onNeedVideoLink ? (
            <IconButton
              variant={exercise.videoUrl ? "ghost" : "dashed"}
              size="sm"
              icon={<VideoIcon className="h-4 w-4" />}
              aria-label="Add video link"
              disabled={disabled || !isExerciseEditable}
              onClick={() => onNeedVideoLink?.()}
            />
          ) : null}
          <IconButton
            variant="ghost"
            size="sm"
            icon={<ChevronUpIcon className="h-4 w-4" />}
            aria-label="Move exercise up"
            disabled={disabled || exerciseIndex === 0 || !isExerciseEditable}
            onClick={onMoveUp}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<ChevronDownIcon className="h-4 w-4" />}
            aria-label="Move exercise down"
            disabled={disabled || exerciseIndex === exerciseCount - 1 || !isExerciseEditable}
            onClick={onMoveDown}
          />
          <IconButton
            variant="danger"
            size="sm"
            icon={<XIcon className="h-4 w-4" />}
            aria-label="Delete exercise"
            disabled={disabled || !isExerciseEditable}
            onClick={onDeleteExercise}
          />
        </div>
      </div>

      <textarea
        value={exercise.notes ?? ""}
        readOnly={disabled}
        rows={1}
        placeholder="Notes"
        aria-label="Notes"
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
          <div className="overflow-x-auto max-md:overflow-visible">
            <table className="w-full border-collapse text-sm md:min-w-[24rem] max-md:block">
              <thead className="max-md:hidden">
                <tr className="border-b border-glass-border text-left text-xs font-medium uppercase tracking-wide text-surface-foreground/80">
                  <th className="w-8 px-2 py-2" aria-label="Reorder" />
                  <th className="px-2 py-2 font-medium">Reps</th>
                  <th className="px-2 py-2 font-medium">Target</th>
                  <th className="px-2 py-2 font-medium">Notes</th>
                  <th className="w-10 px-2 py-2" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="max-md:block">
                <SortableContext
                  items={editableSets.map((set) => set.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {exercise.sets.map((set, setIndex) => (
                    <SortableSetRow
                      key={set.id}
                      set={set}
                      setNumber={setIndex + 1}
                      disabled={disabled}
                      setEditable={isSetEditable(set)}
                      canDelete={exercise.sets.length > 1 && isSetEditable(set)}
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
                        if (!isSetEditable(set)) {
                          return;
                        }

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
                      onTargetUpdate={(target) => {
                        if (!isSetEditable(set)) {
                          return;
                        }

                        updateSet(setIndex, (current) => {
                          if (current.planned.type !== "exact") {
                            return current;
                          }

                          return {
                            ...current,
                            status: "planned",
                            planned: {
                              ...current.planned,
                              target,
                            },
                          };
                        });
                      }}
                      onNotesChange={(value) => {
                        if (!isSetEditable(set)) {
                          return;
                        }

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
                        if (!isSetEditable(set)) {
                          return;
                        }

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

        <div className="flex justify-center border-t border-glass-border/60 px-3 py-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth={false}
            icon={<PlusIcon />}
            aria-label="Add set"
            disabled={disabled}
            onClick={() => {
            const lastSet = exercise.sets.at(-1);
            const nextSet = lastSet ? cloneSetFromPrevious(lastSet) : createDefaultSet();
            autoFocusSetIdRef.current = nextSet.id;
            onExerciseChange({
              ...exercise,
              sets: [...exercise.sets, nextSet] as typeof exercise.sets,
            });
          }}
          >
            Add
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PlanEditableDay({
  day,
  dayPos,
  disabled,
  onChange,
  isSetEditable = () => true,
  isExerciseEditable: isExerciseEditableFn = () => true,
  onNeedVideoLink,
}: PlanEditableDayProps) {
  const editableDay = cloneDayForEditing(day);

  function emitChange(nextDay: Day) {
    onChange(nextDay);
  }

  function updateBlock(blockPos: number, block: typeof editableDay.blocks[number]) {
    const nextBlocks = [...editableDay.blocks];
    nextBlocks[blockPos] = block;
    emitChange({ ...editableDay, blocks: nextBlocks as typeof editableDay.blocks });
  }

  function moveExerciseInBlock(
    blockPos: number,
    exercisePosInBlock: number,
    direction: -1 | 1,
  ) {
    const block = editableDay.blocks[blockPos];
    if (!block) {
      return;
    }

    const targetIndex = exercisePosInBlock + direction;
    if (targetIndex < 0 || targetIndex >= block.exercises.length) {
      return;
    }

    const nextExercises = [...block.exercises];
    const [movedExercise] = nextExercises.splice(exercisePosInBlock, 1);
    nextExercises.splice(targetIndex, 0, movedExercise);

    updateBlock(blockPos, {
      ...block,
      exercises: nextExercises as typeof block.exercises,
    });
  }

  function deleteExercise(blockPos: number, exercisePosInBlock: number) {
    const block = editableDay.blocks[blockPos];
    if (!block) {
      return;
    }

    if (block.exercises.length > 1) {
      updateBlock(blockPos, {
        ...block,
        exercises: block.exercises.filter(
          (_, index) => index !== exercisePosInBlock,
        ) as typeof block.exercises,
      });
      return;
    }

    if (editableDay.blocks.length <= 1) {
      return;
    }

    emitChange({
      ...editableDay,
      blocks: editableDay.blocks.filter((_, index) => index !== blockPos) as typeof editableDay.blocks,
    });
  }

  return (
    <div
      className={`space-y-6 ${disabled ? "pointer-events-none opacity-50" : ""}`}
      data-plan-editable-day
    >
      <Input
        value={editableDay.name ?? ""}
        placeholder={`Day ${dayPos + 1}`}
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

      {editableDay.blocks.map((block, blockPos) => (
        <div
          key={block.id}
          className={isSupersetBlock(block) ? athleteExerciseCardClassName() : "space-y-4"}
        >
          {isSupersetBlock(block) ? <BlockHeader block={block} isSuperset /> : null}
          {block.exercises.map((exercise, exercisePosInBlock) => (
            <EditableExerciseBlock
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={exercisePosInBlock}
              exerciseCount={block.exercises.length}
              disabled={disabled}
              isSetEditable={isSetEditable}
              isExerciseEditable={isExerciseEditableFn(exercise)}
              onExerciseChange={(nextExercise) => {
                updateBlock(blockPos, {
                  ...block,
                  exercises: block.exercises.map((current, index) =>
                    index === exercisePosInBlock ? nextExercise : current,
                  ) as typeof block.exercises,
                });
              }}
              onDeleteExercise={() => deleteExercise(blockPos, exercisePosInBlock)}
              onMoveUp={() => moveExerciseInBlock(blockPos, exercisePosInBlock, -1)}
              onMoveDown={() => moveExerciseInBlock(blockPos, exercisePosInBlock, 1)}
              onNeedVideoLink={
                onNeedVideoLink
                  ? () =>
                      onNeedVideoLink(
                        blockPos,
                        exercisePosInBlock,
                        exercise.name,
                        exercise.videoUrl,
                      )
                  : undefined
              }
            />
          ))}
          {isSupersetBlock(block) ? (
            <div className="flex justify-center border-t border-glass-border/60 pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                fullWidth={false}
                icon={<PlusIcon />}
                aria-label="Add exercise to superset"
                disabled={disabled}
                onClick={() => {
                  updateBlock(blockPos, {
                    ...block,
                    exercises: [
                      ...block.exercises,
                      createDefaultExercise(),
                    ] as typeof block.exercises,
                  });
                }}
              >
                Add exercise
              </Button>
            </div>
          ) : null}
        </div>
      ))}

      <div className="flex justify-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          fullWidth={false}
          icon={<PlusIcon />}
          aria-label="Add exercise"
          disabled={disabled}
          onClick={() => {
            emitChange({
              ...editableDay,
              blocks: [
                ...editableDay.blocks,
                {
                  ...createDefaultBlock(),
                  id: createBlockId(),
                },
              ] as typeof editableDay.blocks,
            });
          }}
        >
          Add exercise
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          fullWidth={false}
          icon={<PlusIcon />}
          aria-label="Add superset"
          disabled={disabled}
          onClick={() => {
            emitChange({
              ...editableDay,
              blocks: [
                ...editableDay.blocks,
                {
                  ...createDefaultSupersetBlock(),
                  id: createBlockId(),
                },
              ] as typeof editableDay.blocks,
            });
          }}
        >
          Add superset
        </Button>
      </div>
    </div>
  );
}
