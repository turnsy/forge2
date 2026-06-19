"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/icons/plus-icon";
import { Button } from "@/components/ui";
import { PlanEditorConfirmModal } from "@/components/plan/plan-editor-confirm-modal";
import type { DaySelection } from "@/lib/plans/plan-day-navigator";
import { resolveDayLocation } from "@/lib/plans/plan-day-navigator";
import {
  addDay,
  addWeek,
  canRemoveDay,
  canRemoveWeek,
  getDayArrayIndex,
  getWeekArrayIndex,
  removeDay,
  removeWeek,
  resolveSelectionAfterAddDay,
  resolveSelectionAfterAddWeek,
  resolveSelectionAfterRemoveDay,
  resolveSelectionAfterRemoveWeek,
  shouldConfirmDeleteDay,
  shouldConfirmDeleteWeek,
} from "@/lib/plans/plan-structure";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

type PendingDelete =
  | { type: "week" }
  | { type: "day" };

export function PlanStructureControls({
  plan,
  selectedWeekIndex,
  selectedDayIndex,
  disabled,
  onPlanChange,
  onSelectionChange,
  layout = "desktop",
}: {
  plan: WorkoutPlan;
  selectedWeekIndex: number;
  selectedDayIndex: number;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
  onSelectionChange: (selection: DaySelection) => void;
  layout?: "desktop" | "mobile";
}) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const weekArrayIndex = getWeekArrayIndex(plan, selectedWeekIndex);
  const dayArrayIndex = getDayArrayIndex(plan, selectedWeekIndex, selectedDayIndex);
  const selectedLocation = resolveDayLocation(plan, selectedWeekIndex, selectedDayIndex);

  function handleAddWeek() {
    const nextPlan = addWeek(plan);
    onPlanChange(nextPlan);
    onSelectionChange(resolveSelectionAfterAddWeek(nextPlan));
  }

  function handleAddDay() {
    const nextPlan = addDay(plan, selectedWeekIndex);
    onPlanChange(nextPlan);
    onSelectionChange(resolveSelectionAfterAddDay(nextPlan, selectedWeekIndex));
  }

  function executeRemoveWeek() {
    if (weekArrayIndex === -1) {
      return;
    }

    const nextPlan = removeWeek(plan, selectedWeekIndex);
    if (!nextPlan) {
      return;
    }

    onPlanChange(nextPlan);
    onSelectionChange(resolveSelectionAfterRemoveWeek(nextPlan, weekArrayIndex));
  }

  function executeRemoveDay() {
    if (!selectedLocation || dayArrayIndex === -1) {
      return;
    }

    const nextPlan = removeDay(plan, selectedWeekIndex, selectedDayIndex);
    if (!nextPlan) {
      return;
    }

    onPlanChange(nextPlan);
    onSelectionChange(
      resolveSelectionAfterRemoveDay(nextPlan, selectedWeekIndex, dayArrayIndex),
    );
  }

  function requestRemoveWeek() {
    if (!canRemoveWeek(plan)) {
      return;
    }

    if (shouldConfirmDeleteWeek(plan, selectedWeekIndex)) {
      setPendingDelete({ type: "week" });
      return;
    }

    executeRemoveWeek();
  }

  function requestRemoveDay() {
    if (!canRemoveDay(plan, selectedWeekIndex) || !selectedLocation) {
      return;
    }

    if (shouldConfirmDeleteDay(selectedLocation.day)) {
      setPendingDelete({ type: "day" });
      return;
    }

    executeRemoveDay();
  }

  function handleConfirmDelete() {
    if (pendingDelete?.type === "week") {
      executeRemoveWeek();
    } else if (pendingDelete?.type === "day") {
      executeRemoveDay();
    }

    setPendingDelete(null);
  }

  const weekControls = (
    <div
      className={
        layout === "desktop"
          ? "flex min-w-0 flex-1 items-center justify-end gap-2"
          : "flex items-center justify-end gap-2"
      }
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        fullWidth={layout === "mobile"}
        icon={<PlusIcon />}
        aria-label="Add week"
        disabled={disabled}
        onClick={handleAddWeek}
      >
        Add
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        fullWidth={layout === "mobile"}
        disabled={disabled || !canRemoveWeek(plan)}
        onClick={requestRemoveWeek}
      >
        Delete week
      </Button>
    </div>
  );

  const dayControls = (
    <div
      className={
        layout === "desktop"
          ? "flex min-w-0 flex-1 items-center justify-end gap-2"
          : "flex items-center justify-end gap-2"
      }
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        fullWidth={layout === "mobile"}
        icon={<PlusIcon />}
        aria-label="Add day"
        disabled={disabled}
        onClick={handleAddDay}
      >
        Add
      </Button>
      <Button
        type="button"
        variant="danger"
        size="sm"
        fullWidth={layout === "mobile"}
        disabled={disabled || !canRemoveDay(plan, selectedWeekIndex)}
        onClick={requestRemoveDay}
      >
        Delete day
      </Button>
    </div>
  );

  const confirmModal =
    pendingDelete?.type === "week" ? (
      <PlanEditorConfirmModal
        open
        title="Delete week?"
        description="This week and all of its days will be removed from the plan."
        confirmLabel="Delete week"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    ) : pendingDelete?.type === "day" ? (
      <PlanEditorConfirmModal
        open
        title="Delete day?"
        description="This day and all of its exercises will be removed from the plan."
        confirmLabel="Delete day"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    ) : null;

  if (layout === "mobile") {
    return (
      <>
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-muted">Week</p>
            {weekControls}
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-surface-muted">Day</p>
            {dayControls}
          </div>
        </div>
        {confirmModal}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {weekControls}
        {dayControls}
      </div>
      {confirmModal}
    </>
  );
}
