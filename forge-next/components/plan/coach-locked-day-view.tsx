import { LockIcon } from "@/components/icons/lock-icon";
import { PlanBlockSection } from "@/components/plan/plan-block-section";
import { getDayTitle } from "@/lib/plans/display";
import type { Day } from "@/lib/plans/workout-plan";

export function CoachLockedDayView({
  day,
  dayPos,
}: {
  day: Day;
  dayPos: number;
}) {
  return (
    <div
      className="space-y-6 rounded-lg bg-zinc-100/80 p-4 dark:bg-zinc-800/50"
      data-coach-locked-day
      data-testid="coach-locked-day"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 text-lg font-semibold text-surface-muted">
          {getDayTitle(day, dayPos)}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <LockIcon className="h-4 w-4 text-surface-muted" />
          <span className="text-xs font-medium uppercase tracking-wide text-surface-muted">
            Completed
          </span>
        </div>
      </div>
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
