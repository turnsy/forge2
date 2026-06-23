"use client";

import { ChevronDownIcon } from "@/components/icons/chevron-down-icon";
import { ChevronUpIcon } from "@/components/icons/chevron-up-icon";
import { PlusIcon } from "@/components/icons/plus-icon";
import { XIcon } from "@/components/icons/x-icon";
import {
  EditableExerciseBlock,
  cloneSetFromPrevious,
} from "@/components/plan/plan-editable-exercise";
import { PlanExerciseBlock } from "@/components/plan/plan-exercise-block";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import { Button, IconButton } from "@/components/ui";
import { getSupersetRoundCount } from "@/lib/plans/day-blocks";
import {
  createDefaultExercise,
  createDefaultSet,
} from "@/lib/plans/plan-defaults";
import { isExerciseEditable } from "@/lib/plans/plan-editability";
import type { Exercise, Set, SupersetGroup } from "@/lib/plans/workout-plan";
import { accordionNestedClass, controlClass } from "@/lib/theme";

function syncAddRound(superset: SupersetGroup): SupersetGroup {
  return {
    ...superset,
    exercises: superset.exercises.map((exercise) => {
      const lastSet = exercise.sets.at(-1);
      const nextSet = lastSet ? cloneSetFromPrevious(lastSet) : createDefaultSet();

      return {
        ...exercise,
        sets: [...exercise.sets, nextSet] as typeof exercise.sets,
      };
    }) as typeof superset.exercises,
  };
}

function syncRemoveRound(superset: SupersetGroup): SupersetGroup {
  return {
    ...superset,
    exercises: superset.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.slice(0, -1) as typeof exercise.sets,
    })) as typeof superset.exercises,
  };
}

export function PlanSupersetBlock({
  superset,
  view,
}: {
  superset: SupersetGroup;
  view: PlanViewerView;
}) {
  const roundCount = getSupersetRoundCount(superset);

  return (
    <section
      className={[accordionNestedClass(), "space-y-4 border border-glass-border p-4"].join(" ")}
      data-superset-block
    >
      <div>
        <h4 className="text-base font-semibold text-surface-foreground">Superset</h4>
        {superset.notes ? (
          <p className="mt-1 text-sm text-surface-muted">{superset.notes}</p>
        ) : null}
        <p className="mt-1 text-xs uppercase tracking-wide text-surface-muted">
          {roundCount} round{roundCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-4">
        {superset.exercises.map((exercise, index) => (
          <PlanExerciseBlock
            key={`${exercise.id ?? exercise.name}-${index}`}
            exercise={exercise}
            view={view}
            surfaceVariant="default"
          />
        ))}
      </div>
    </section>
  );
}

export type EditableSupersetBlockProps = {
  superset: SupersetGroup;
  blockIndex: number;
  blockCount: number;
  disabled: boolean;
  isSetEditable: (set: Set) => boolean;
  onSupersetChange: (superset: SupersetGroup) => void;
  onDeleteBlock: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onNeedVideoLink?: (
    blockIndex: number,
    exerciseIndex: number,
    exerciseName: string,
    currentVideoUrl?: string,
  ) => void;
};

export function EditableSupersetBlock({
  superset,
  blockIndex,
  blockCount,
  disabled,
  isSetEditable,
  onSupersetChange,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
  onNeedVideoLink,
}: EditableSupersetBlockProps) {
  const roundCount = getSupersetRoundCount(superset);
  const supersetEditable = superset.exercises.some((exercise) => isExerciseEditable(exercise));

  function updateExercise(exerciseIndex: number, exercise: Exercise) {
    const nextExercises = [...superset.exercises];
    nextExercises[exerciseIndex] = exercise;
    onSupersetChange({ ...superset, exercises: nextExercises as typeof superset.exercises });
  }

  function moveExercise(exerciseIndex: number, direction: -1 | 1) {
    const targetIndex = exerciseIndex + direction;
    if (targetIndex < 0 || targetIndex >= superset.exercises.length) {
      return;
    }

    const nextExercises = [...superset.exercises];
    const [moved] = nextExercises.splice(exerciseIndex, 1);
    nextExercises.splice(targetIndex, 0, moved);
    onSupersetChange({ ...superset, exercises: nextExercises as typeof superset.exercises });
  }

  function handleAddRound() {
    onSupersetChange(syncAddRound(superset));
  }

  function handleRemoveRound() {
    if (roundCount <= 1) {
      return;
    }

    onSupersetChange(syncRemoveRound(superset));
  }

  return (
    <section
      className={[accordionNestedClass(), "space-y-4 border border-glass-border p-4"].join(" ")}
      data-superset-block
      data-superset-editable={supersetEditable ? "true" : "false"}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <h4 className="text-base font-semibold text-surface-foreground">Superset</h4>
          <textarea
            value={superset.notes ?? ""}
            readOnly={disabled}
            rows={1}
            placeholder="Notes (e.g. rest between rounds)"
            aria-label="Superset notes"
            className={`${controlClass("sm")} min-h-[2.25rem] w-full resize-y`}
            onChange={(event) =>
              onSupersetChange({
                ...superset,
                notes: event.target.value || undefined,
              })
            }
          />
          <p className="text-xs uppercase tracking-wide text-surface-muted">
            {roundCount} round{roundCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            variant="ghost"
            size="sm"
            icon={<ChevronUpIcon className="h-4 w-4" />}
            aria-label="Move superset up"
            disabled={disabled || blockIndex === 0 || !supersetEditable}
            onClick={onMoveUp}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={<ChevronDownIcon className="h-4 w-4" />}
            aria-label="Move superset down"
            disabled={disabled || blockIndex === blockCount - 1 || !supersetEditable}
            onClick={onMoveDown}
          />
          <IconButton
            variant="danger"
            size="sm"
            icon={<XIcon className="h-4 w-4" />}
            aria-label="Delete superset"
            disabled={disabled || !supersetEditable}
            onClick={onDeleteBlock}
          />
        </div>
      </div>

      <div className="space-y-4">
        {superset.exercises.map((exercise, exerciseIndex) => (
          <EditableExerciseBlock
            key={exercise.id ?? `${exercise.name}-${exerciseIndex}`}
            exercise={exercise}
            exerciseIndex={exerciseIndex}
            exerciseCount={superset.exercises.length}
            disabled={disabled}
            isSetEditable={isSetEditable}
            isExerciseEditable={isExerciseEditable(exercise)}
            compact
            onExerciseChange={(nextExercise) => updateExercise(exerciseIndex, nextExercise)}
            onMoveUp={() => moveExercise(exerciseIndex, -1)}
            onMoveDown={() => moveExercise(exerciseIndex, 1)}
            onDeleteExercise={
              superset.exercises.length > 2
                ? () => {
                    onSupersetChange({
                      ...superset,
                      exercises: superset.exercises.filter(
                        (_, index) => index !== exerciseIndex,
                      ) as typeof superset.exercises,
                    });
                  }
                : undefined
            }
            onNeedVideoLink={
              onNeedVideoLink
                ? (_, exerciseName, currentVideoUrl) =>
                    onNeedVideoLink(blockIndex, exerciseIndex, exerciseName, currentVideoUrl)
                : undefined
            }
            onAddSet={handleAddRound}
            onRemoveSet={() => handleRemoveRound()}
          />
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          fullWidth={false}
          icon={<PlusIcon />}
          aria-label="Add exercise to superset"
          disabled={disabled || !supersetEditable}
          onClick={() => {
            onSupersetChange({
              ...superset,
              exercises: [
                ...superset.exercises,
                {
                  ...createDefaultExercise(`Exercise ${String.fromCharCode(65 + superset.exercises.length)}`),
                  sets: Array.from({ length: roundCount }, (_, index) => {
                    const template = superset.exercises[0]?.sets[index];
                    return template ? cloneSetFromPrevious(template) : createDefaultSet();
                  }) as Exercise["sets"],
                },
              ] as typeof superset.exercises,
            });
          }}
        >
          Add exercise
        </Button>
      </div>
    </section>
  );
}
