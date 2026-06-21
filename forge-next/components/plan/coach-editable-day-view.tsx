"use client";

import { useState } from "react";
import { PlanEditableDay } from "@/components/plan/plan-editable-day";
import { Button, Checkbox, Input } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { applyExerciseVideoLink } from "@/lib/plans/exercise-video-link";
import {
  isExerciseEditable,
  isSetEditable,
} from "@/lib/plans/plan-editability";
import type { Day, Exercise, Set, WorkoutPlan } from "@/lib/plans/workout-plan";

type VideoLinkModalState = {
  exerciseIndex: number;
  exerciseName: string;
  currentVideoUrl?: string;
};

export type CoachEditableDayViewProps = {
  plan: WorkoutPlan;
  weekIndex: number;
  dayIndex: number;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
  isSetEditable?: (set: Set) => boolean;
  isExerciseEditable?: (exercise: Exercise) => boolean;
};

export function CoachEditableDayView({
  plan,
  weekIndex,
  dayIndex,
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

  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  const day = week?.days.find((candidate) => candidate.index === dayIndex);

  if (!day) {
    return <p className="text-sm text-surface-muted">Day not found</p>;
  }

  function handleDayChange(updatedDay: Day) {
    const newPlan = structuredClone(plan);
    const targetWeek = newPlan.weeks.find((candidate) => candidate.index === weekIndex);
    const targetDay = targetWeek?.days.find((candidate) => candidate.index === dayIndex);

    if (!targetWeek || !targetDay) {
      return;
    }

    const dayPosition = targetWeek.days.findIndex(
      (candidate) => candidate.index === dayIndex,
    );
    targetWeek.days[dayPosition] = updatedDay;
    onPlanChange(newPlan);
  }

  function openVideoLinkModal(
    exerciseIndex: number,
    exerciseName: string,
    currentVideoUrl?: string,
  ) {
    setVideoLinkModal({ exerciseIndex, exerciseName, currentVideoUrl });
    setVideoUrlInput(currentVideoUrl ?? "");
    setAddToAllExercises(false);
  }

  function closeVideoLinkModal() {
    setVideoLinkModal(null);
    setVideoUrlInput("");
    setAddToAllExercises(false);
  }

  function handleVideoLinkConfirm() {
    if (!videoLinkModal) {
      return;
    }

    const updatedPlan = applyExerciseVideoLink(plan, {
      weekIndex,
      dayIndex,
      exerciseIndex: videoLinkModal.exerciseIndex,
      exerciseName: videoLinkModal.exerciseName,
      videoUrl: videoUrlInput,
      addToAll: addToAllExercises,
    });

    onPlanChange(updatedPlan);
    closeVideoLinkModal();
  }

  return (
    <>
      <PlanEditableDay
        day={day}
        disabled={disabled}
        isSetEditable={isSetEditableProp}
        isExerciseEditable={isExerciseEditableProp}
        onChange={handleDayChange}
        onNeedVideoLink={openVideoLinkModal}
      />

      <Modal
        open={videoLinkModal !== null}
        title="Video Link"
        onClose={closeVideoLinkModal}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={closeVideoLinkModal}
            >
              Cancel
            </Button>
            <Button type="button" fullWidth={false} onClick={handleVideoLinkConfirm}>
              Confirm
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            value={videoUrlInput}
            placeholder="Paste a video link (YouTube, Vimeo, etc.)"
            aria-label="Video link"
            onChange={(event) => setVideoUrlInput(event.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-surface-foreground">
            <Checkbox
              checked={addToAllExercises}
              aria-label="Add to all occurrences of this exercise"
              onChange={setAddToAllExercises}
            />
            Add to all occurrences of this exercise
          </label>
        </div>
      </Modal>
    </>
  );
}
