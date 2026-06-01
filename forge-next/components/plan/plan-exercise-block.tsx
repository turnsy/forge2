import type { Exercise } from "@/lib/plans/workout-plan";
import { PlanSetTable, type PlanViewerView } from "@/components/plan/plan-set-table";

export function PlanExerciseBlock({
  exercise,
  view,
}: {
  exercise: Exercise;
  view: PlanViewerView;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h4 className="text-base font-semibold text-surface-foreground">{exercise.name}</h4>
        {exercise.notes ? (
          <p className="mt-1 text-sm text-surface-muted">{exercise.notes}</p>
        ) : null}
      </div>
      <PlanSetTable sets={exercise.sets} view={view} />
    </section>
  );
}
