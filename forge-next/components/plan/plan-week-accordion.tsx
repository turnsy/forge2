import type { Week } from "@/lib/plans/workout-plan";
import { PlanDaySection } from "@/components/plan/plan-day-section";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import { listRowClass } from "@/lib/theme";
import { getWeekTitle } from "@/lib/plans/display";

export function PlanWeekAccordion({
  week,
  view,
  defaultOpen = true,
}: {
  week: Week;
  view: PlanViewerView;
  defaultOpen?: boolean;
}) {
  const dayCount = week.days.length;

  return (
    <details open={defaultOpen} className={listRowClass()}>
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-surface-foreground">{getWeekTitle(week)}</h2>
          <span className="shrink-0 text-sm text-surface-muted">
            {dayCount} {dayCount === 1 ? "day" : "days"}
          </span>
        </div>
        {week.notes ? (
          <p className="mt-2 text-sm text-surface-muted">{week.notes}</p>
        ) : null}
      </summary>
      <div className="mt-6 space-y-8 border-t border-glass-border pt-6">
        {week.days.map((day) => (
          <PlanDaySection key={day.code} day={day} view={view} />
        ))}
      </div>
    </details>
  );
}
