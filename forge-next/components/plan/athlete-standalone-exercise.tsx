import type { ReactNode } from "react";
import {
  AthleteExerciseHeader,
  AthleteExerciseNotes,
  athleteExerciseCardClassName,
} from "@/components/plan/plan-athlete-parts";
import type { Exercise } from "@/lib/plans/workout-plan";

export function AthleteStandaloneExerciseSection({
  exercise,
  highlightComplete = false,
  complete = false,
  children,
}: {
  exercise: Exercise;
  highlightComplete?: boolean;
  complete?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={highlightComplete ? athleteExerciseCardClassName(complete) : "space-y-4"}
      data-exercise-complete={highlightComplete ? (complete ? "true" : "false") : undefined}
    >
      <AthleteExerciseHeader name={exercise.name} videoUrl={exercise.videoUrl} />
      <AthleteExerciseNotes notes={exercise.notes} />
      <div className="space-y-3">{children}</div>
    </section>
  );
}
