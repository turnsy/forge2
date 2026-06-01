import type { Day } from "@/lib/plans/workout-plan";
import { PlanExerciseBlock } from "@/components/plan/plan-exercise-block";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import { AccordionItem, Separator } from "@/components/ui";
import { getDayTitle } from "@/lib/plans/display";

export function PlanDaySection({
  day,
  view,
  defaultOpen = true,
}: {
  day: Day;
  view: PlanViewerView;
  defaultOpen?: boolean;
}) {
  return (
    <AccordionItem
      variant="nested"
      defaultOpen={defaultOpen}
      title={
        <h3 className="text-base font-semibold text-surface-foreground">{getDayTitle(day)}</h3>
      }
      description={
        day.notes ? <p className="text-sm text-surface-muted">{day.notes}</p> : undefined
      }
    >
      <div className="space-y-6">
        {day.exercises.map((exercise, index) => (
          <div key={`${day.code}-${exercise.id ?? exercise.name}-${index}`}>
            {index > 0 ? <Separator className="mb-6" /> : null}
            <PlanExerciseBlock exercise={exercise} view={view} surfaceVariant="default" />
          </div>
        ))}
      </div>
    </AccordionItem>
  );
}
