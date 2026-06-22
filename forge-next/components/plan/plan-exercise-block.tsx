import { VideoIcon } from "@/components/icons/video-icon";
import type { AccordionVariant } from "@/components/ui/accordion";
import { IconButton } from "@/components/ui";
import { PlanSetTable, type PlanViewerView } from "@/components/plan/plan-set-table";
import type { Exercise } from "@/lib/plans/workout-plan";

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
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-base font-semibold text-surface-foreground">{exercise.name}</h4>
          {exercise.videoUrl ? (
            <IconButton
              variant="ghost"
              size="sm"
              icon={<VideoIcon className="h-4 w-4" />}
              aria-label="Video link attached"
              title="Video link attached"
              onClick={() =>
                window.open(exercise.videoUrl, "_blank", "noopener,noreferrer")
              }
            />
          ) : null}
        </div>
        {exercise.notes ? (
          <p className="mt-1 text-sm text-surface-muted">{exercise.notes}</p>
        ) : null}
      </div>
      <PlanSetTable sets={exercise.sets} view={view} surfaceVariant={surfaceVariant} />
    </section>
  );
}
