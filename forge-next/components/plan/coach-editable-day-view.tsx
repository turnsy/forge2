"use client";

import { useState } from "react";
import { PlanEditableDay } from "@/components/plan/plan-editable-day";
import { Button, Checkbox, Input } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { applyExerciseVideoLink } from "@/lib/plans/exercise-video-link";
import { getFlatExercisePos } from "@/lib/plans/day-blocks";
import {
  isExerciseEditable,
  isSetEditable,
} from "@/lib/plans/plan-editability";
import type { Day, Exercise, Set, WorkoutPlan } from "@/lib/plans/workout-plan";

type VideoLinkModalState = {
  exercisePos: number;
  exerciseName: string;
  currentVideoUrl?: string;
};

export type CoachEditableDayViewProps = {
  plan: WorkoutPlan;
  weekPos: number;
  dayPos: number;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
  isSetEditable?: (set: Set) => boolean;
  isExerciseEditable?: (exercise: Exercise) => boolean;
};

export function CoachEditableDayView({
  plan,
  weekPos,
  dayPos,
  disabled,
  onPlanChange,
  isSetEditable: isSetEditableProp = isSetEditable,
  isExerciseEditable: isExerciseEditableProp = isExerciseEditable,
}: CoachEditableDayViewProps) {
  const [videoLinkModal, setVideoLinkModal] = useState<VideoLinkModalState | null>(
    null,
  );
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [addToAllExercises, setAddToAllExercises] = useState(false);

  const day = plan.weeks[weekPos]?.days[dayPos];

  if (!day) {
    return <p className="text-sm text-surface-muted">Day not found</p>;
  }

  function handleDayChange(updatedDay: Day) {
    const newPlan = structuredClone(plan);
    const targetWeek = newPlan.weeks[weekPos];
    if (!targetWeek?.days[dayPos]) {
      return;
    }

    targetWeek.days[dayPos] = updatedDay;
    onPlanChange(newPlan);
  }

  function openVideoLinkModal(
    blockPos: number,
    exercisePosInBlock: number,
    exerciseName: string,
    currentVideoUrl?: string,
  ) {
    setVideoLinkModal({
      exercisePos: getFlatExercisePos(day, blockPos, exercisePosInBlock),
      exerciseName,
      currentVideoUrl,
    });
    setVideoUrlInput(currentVideoUrl ?? "");
    setAddToAllExercises(false);
  }

  function closeVideoLinkModal() {
    setVideoLinkModal(null);
    setVideoUrlInput("");
    setAddToAllExercises(false);
  }

  function handleSaveVideoLink() {
    if (!videoLinkModal) {
      return;
    }

    const nextPlan = applyExerciseVideoLink(plan, {
      weekPos,
      dayPos,
      exercisePos: videoLinkModal.exercisePos,
      exerciseName: videoLinkModal.exerciseName,
      videoUrl: videoUrlInput,
      addToAll: addToAllExercises,
    });

    onPlanChange(nextPlan);
    closeVideoLinkModal();
  }

  return (
    <>
      <PlanEditableDay
        day={day}
        dayPos={dayPos}
        disabled={disabled}
        onChange={handleDayChange}
        isSetEditable={isSetEditableProp}
        isExerciseEditable={isExerciseEditableProp}
        onNeedVideoLink={openVideoLinkModal}
      />

      <Modal
        open={videoLinkModal !== null}
        title="Exercise video link"
        onClose={closeVideoLinkModal}
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-muted">
            {videoLinkModal?.exerciseName}
          </p>
          <Input
            label="Video URL"
            value={videoUrlInput}
            placeholder="https://"
            onChange={(event) => setVideoUrlInput(event.target.value)}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-foreground">
            <Checkbox
              aria-label="Apply to all exercises with this name"
              checked={addToAllExercises}
              onChange={(checked) => setAddToAllExercises(checked)}
            />
            Apply to all exercises with this name
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeVideoLinkModal}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveVideoLink}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
