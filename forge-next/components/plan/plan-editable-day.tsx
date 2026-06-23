"use client";

import { PlusIcon } from "@/components/icons/plus-icon";
import { Button, Input } from "@/components/ui";
import { EditableExerciseBlock } from "@/components/plan/plan-editable-exercise";
import { EditableSupersetBlock } from "@/components/plan/plan-superset-block";
import { migrateDayToBlocks } from "@/lib/plans/day-blocks";
import {
  createDefaultSet,
  createDefaultSuperset,
  createExerciseId,
} from "@/lib/plans/plan-defaults";
import type {
  Day,
  DayBlock,
  Exercise,
  ExerciseBlock,
  Set,
  SupersetGroup,
} from "@/lib/plans/workout-plan";
import { isExerciseBlock } from "@/lib/plans/day-blocks";

export type PlanEditableDayProps = {
  day: Day;
  disabled: boolean;
  onChange: (day: Day) => void;
  isSetEditable?: (set: Set) => boolean;
  isExerciseEditable?: (exercise: Exercise) => boolean;
  onNeedVideoLink?: (
    blockIndex: number,
    exerciseIndex: number,
    exerciseName: string,
    currentVideoUrl?: string,
  ) => void;
};

function ensureExerciseId(exercise: Exercise): Exercise {
  if (exercise.id) {
    return exercise;
  }

  return { ...exercise, id: createExerciseId() };
}

function cloneBlockForEditing(block: DayBlock): DayBlock {
  if (isExerciseBlock(block)) {
    return {
      type: "exercise",
      exercise: {
        ...ensureExerciseId(block.exercise),
        sets: [...block.exercise.sets],
      },
    };
  }

  return {
    type: "superset",
    notes: block.notes,
    exercises: block.exercises.map((exercise) => ({
      ...ensureExerciseId(exercise),
      sets: [...exercise.sets],
    })) as SupersetGroup["exercises"],
  };
}

function cloneDayForEditing(day: Day): Day {
  const normalized = migrateDayToBlocks(day);
  return {
    ...normalized,
    blocks: normalized.blocks.map(cloneBlockForEditing) as Day["blocks"],
  };
}

export { reorderSetsInExercise } from "@/components/plan/plan-editable-exercise";

export function PlanEditableDay({
  day,
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

  function updateBlock(blockIndex: number, block: DayBlock) {
    const nextBlocks = [...editableDay.blocks];
    nextBlocks[blockIndex] = block;
    emitChange({ ...editableDay, blocks: nextBlocks as typeof editableDay.blocks });
  }

  function moveBlock(blockIndex: number, direction: -1 | 1) {
    const targetIndex = blockIndex + direction;
    if (targetIndex < 0 || targetIndex >= editableDay.blocks.length) {
      return;
    }

    const nextBlocks = [...editableDay.blocks];
    const [moved] = nextBlocks.splice(blockIndex, 1);
    nextBlocks.splice(targetIndex, 0, moved);
    emitChange({ ...editableDay, blocks: nextBlocks as typeof editableDay.blocks });
  }

  return (
    <div
      className={`space-y-6 ${disabled ? "pointer-events-none opacity-50" : ""}`}
      data-plan-editable-day
    >
      <Input
        value={editableDay.name ?? ""}
        placeholder={`Day ${editableDay.index}`}
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

      {editableDay.blocks.map((block, blockIndex) => {
        if (isExerciseBlock(block)) {
          return (
            <div key={block.exercise.id ?? `block-${blockIndex}`} className="space-y-2">
              <EditableExerciseBlock
                exercise={block.exercise}
                exerciseIndex={blockIndex}
                exerciseCount={editableDay.blocks.length}
                disabled={disabled}
                isSetEditable={isSetEditable}
                isExerciseEditable={isExerciseEditableFn(block.exercise)}
                onExerciseChange={(exercise) =>
                  updateBlock(blockIndex, { type: "exercise", exercise })
                }
                onDeleteExercise={() => {
                  emitChange({
                    ...editableDay,
                    blocks: editableDay.blocks.filter(
                      (_, index) => index !== blockIndex,
                    ) as Day["blocks"],
                  });
                }}
                onMoveUp={() => moveBlock(blockIndex, -1)}
                onMoveDown={() => moveBlock(blockIndex, 1)}
                onNeedVideoLink={
                  onNeedVideoLink
                    ? (_, exerciseName, currentVideoUrl) =>
                        onNeedVideoLink(blockIndex, 0, exerciseName, currentVideoUrl)
                    : undefined
                }
              />
            </div>
          );
        }

        return (
          <EditableSupersetBlock
            key={`superset-${blockIndex}`}
            superset={block}
            blockIndex={blockIndex}
            blockCount={editableDay.blocks.length}
            disabled={disabled}
            isSetEditable={isSetEditable}
            onSupersetChange={(superset) => updateBlock(blockIndex, superset)}
            onDeleteBlock={() => {
              emitChange({
                ...editableDay,
                blocks: editableDay.blocks.filter(
                  (_, index) => index !== blockIndex,
                ) as Day["blocks"],
              });
            }}
            onMoveUp={() => moveBlock(blockIndex, -1)}
            onMoveDown={() => moveBlock(blockIndex, 1)}
            onNeedVideoLink={onNeedVideoLink}
          />
        );
      })}

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          fullWidth={false}
          icon={<PlusIcon />}
          aria-label="Add exercise"
          disabled={disabled}
          onClick={() => {
            const exerciseBlock: ExerciseBlock = {
              type: "exercise",
              exercise: {
                id: createExerciseId(),
                name: "New Exercise",
                sets: [createDefaultSet()],
              },
            };

            emitChange({
              ...editableDay,
              blocks: [...editableDay.blocks, exerciseBlock] as Day["blocks"],
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
              blocks: [...editableDay.blocks, createDefaultSuperset()] as Day["blocks"],
            });
          }}
        >
          Add superset
        </Button>
      </div>
    </div>
  );
}
