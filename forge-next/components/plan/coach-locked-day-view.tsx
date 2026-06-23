import { LockIcon } from "@/components/icons/lock-icon";
import { PlanExerciseBlock } from "@/components/plan/plan-exercise-block";
import { PlanSupersetBlock } from "@/components/plan/plan-superset-block";
import { getDayBlocks, isExerciseBlock } from "@/lib/plans/day-blocks";
import { getDayTitle } from "@/lib/plans/display";
import type { Day } from "@/lib/plans/workout-plan";

export function CoachLockedDayView({ day }: { day: Day }) {
  const blocks = getDayBlocks(day);

  return (
    <div
      className="space-y-6 rounded-lg bg-zinc-100/80 p-4 dark:bg-zinc-800/50"
      data-coach-locked-day
      data-testid="coach-locked-day"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 text-lg font-semibold text-surface-muted">{getDayTitle(day)}</h2>
        <div className="flex shrink-0 items-center gap-2">
          <LockIcon className="h-4 w-4 text-surface-muted" />
          <span className="text-xs font-medium uppercase tracking-wide text-surface-muted">
            Completed
          </span>
        </div>
      </div>
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
