import type { AccordionVariant } from "@/components/ui/accordion";
import { PlanExerciseBlock, type PlanViewerView } from "@/components/plan/plan-exercise-block";
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
  const isSuperset = isSupersetBlock(block);

  return (
    <section
      className={
        isSuperset
          ? "space-y-4 rounded-lg border border-glass-border/80 bg-glass/30 p-4"
          : "space-y-4"
      }
      data-plan-block
      data-superset={isSuperset ? "true" : "false"}
    >
      {isSuperset || block.label ? (
        <div className="flex items-center gap-2">
          {isSuperset ? (
            <span className="rounded-full border border-glass-border/80 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-surface-muted">
              Superset
            </span>
          ) : null}
          {block.label ? (
            <h3 className="text-sm font-medium text-surface-muted">{block.label}</h3>
          ) : null}
        </div>
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
