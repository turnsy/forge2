import type { AccordionVariant } from "@/components/ui/accordion";
import { PlanExerciseBlock } from "@/components/plan/plan-exercise-block";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import { PlanSupersetView } from "@/components/plan/plan-superset-view";
import { isSupersetBlock } from "@/lib/plans/day-blocks";
import type { Block } from "@/lib/plans/workout-plan";

export function PlanBlockSection({
  block,
  dayCode,
  view,
  surfaceVariant = "default",
}: {
  block: Block;
  dayCode: string;
  view: PlanViewerView;
  surfaceVariant?: AccordionVariant;
}) {
  if (isSupersetBlock(block)) {
    return <PlanSupersetView block={block} view={view} surfaceVariant={surfaceVariant} />;
  }

  return (
    <section className="space-y-4" data-plan-block data-superset="false">
      {block.label ? (
        <h3 className="text-sm font-medium text-surface-muted">{block.label}</h3>
      ) : null}
      {block.notes ? (
        <p className="text-sm text-surface-muted">{block.notes}</p>
      ) : null}
      {block.exercises.map((exercise, index) => (
        <PlanExerciseBlock
          key={`${dayCode}-${block.id}-${exercise.id}-${index}`}
          exercise={exercise}
          view={view}
          surfaceVariant={surfaceVariant}
        />
      ))}
    </section>
  );
}
