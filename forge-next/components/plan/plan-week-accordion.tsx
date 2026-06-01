import type { Week } from "@/lib/plans/workout-plan";
import { PlanDaySection } from "@/components/plan/plan-day-section";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import { AccordionItem } from "@/components/ui";
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
    <AccordionItem
      variant="default"
      defaultOpen={defaultOpen}
      title={
        <h2 className="text-lg font-semibold text-surface-foreground">{getWeekTitle(week)}</h2>
      }
      meta={
        <span className="text-sm text-surface-muted">
          {dayCount} {dayCount === 1 ? "day" : "days"}
        </span>
      }
      description={
        week.notes ? (
          <p className="text-sm text-surface-muted">{week.notes}</p>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {week.days.map((day) => (
          <PlanDaySection key={day.code} day={day} view={view} />
        ))}
      </div>
    </AccordionItem>
  );
}
