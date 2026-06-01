import type { Exercise } from "@/lib/plans/workout-plan";
import type { AccordionVariant } from "@/components/ui/accordion";
import { PlanSetTable, type PlanViewerView } from "@/components/plan/plan-set-table";

export function PlanExerciseBlock({
  exercise,
  view,
  surfaceVariant = "default",
}: {
  exercise: Exercise;
  view: PlanViewerView;
  surfaceVariant?: AccordionVariant;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h4 className="text-base font-semibold text-surface-foreground">{exercise.name}</h4>
        {exercise.notes ? (
          <p className="mt-1 text-sm text-surface-muted">{exercise.notes}</p>
        ) : null}
      </div>
      <PlanSetTable sets={exercise.sets} view={view} surfaceVariant={surfaceVariant} />
    </section>
  );
}
