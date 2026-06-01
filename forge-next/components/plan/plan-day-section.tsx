import type { Day } from "@/lib/plans/workout-plan";
import { PlanExerciseBlock } from "@/components/plan/plan-exercise-block";
import { Separator } from "@/components/ui";
import { getDayTitle } from "@/lib/plans/display";
import type { PlanViewerView } from "@/components/plan/plan-set-table";

export function PlanDaySection({
  day,
  view,
}: {
  day: Day;
  view: PlanViewerView;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-surface-foreground">{getDayTitle(day)}</h3>
        {day.notes ? (
          <p className="mt-1 text-sm text-surface-muted">{day.notes}</p>
        ) : null}
      </div>
      <div className="space-y-6">
        {day.exercises.map((exercise, index) => (
          <div key={`${day.code}-${exercise.id ?? exercise.name}-${index}`}>
            {index > 0 ? <Separator className="mb-6" /> : null}
            <PlanExerciseBlock exercise={exercise} view={view} />
          </div>
        ))}
      </div>
    </section>
  );
}
