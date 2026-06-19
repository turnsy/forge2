"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/icons/chevron-down-icon";
import { ChevronUpIcon } from "@/components/icons/chevron-up-icon";
import { PlusIcon } from "@/components/icons/plus-icon";
import { XIcon } from "@/components/icons/x-icon";
import { Button, IconButton } from "@/components/ui";
import { PlanEditorConfirmModal } from "@/components/plan/plan-editor-confirm-modal";
import type { DaySelection } from "@/lib/plans/plan-day-navigator";
import { resolveDayLocation } from "@/lib/plans/plan-day-navigator";
import {
  addDay,
  addWeek,
  canRemoveDay,
  canRemoveWeek,
  canMoveDay,
  canMoveWeek,
  getDayArrayIndex,
  getWeekArrayIndex,
  moveDay,
  moveWeek,
  removeDay,
  removeWeek,
  resolveSelectionAfterAddDay,
  resolveSelectionAfterAddWeek,
  resolveSelectionAfterMoveDay,
  resolveSelectionAfterMoveWeek,
  resolveSelectionAfterRemoveDay,
  resolveSelectionAfterRemoveWeek,
  shouldConfirmDeleteDay,
  shouldConfirmDeleteWeek,
} from "@/lib/plans/plan-structure";
import type { Day, WorkoutPlan } from "@/lib/plans/workout-plan";

type PendingDelete =
  | { type: "week" }
  | { type: "day" };

function canMoveSelectedDay(
  plan: WorkoutPlan,
  weekIndex: number,
  dayIndex: number,
  direction: -1 | 1,
  canEditDay: (day: Day) => boolean,
): boolean {
  if (!canMoveDay(plan, weekIndex, dayIndex, direction)) {
    return false;
  }

  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  if (!week) {
    return false;
  }

  const dayPosition = week.days.findIndex((day) => day.index === dayIndex);
  const selectedDay = week.days[dayPosition];
  const neighborDay = week.days[dayPosition + direction];

  if (!selectedDay || !neighborDay) {
    return false;
  }

  return canEditDay(selectedDay) && canEditDay(neighborDay);
}

function canMoveSelectedWeek(
  plan: WorkoutPlan,
  weekIndex: number,
  direction: -1 | 1,
  canEditDay: (day: Day) => boolean,
): boolean {
  if (!canMoveWeek(plan, weekIndex, direction)) {
    return false;
  }

  const weekPosition = getWeekArrayIndex(plan, weekIndex);
  const selectedWeek = plan.weeks[weekPosition];
  const neighborWeek = plan.weeks[weekPosition + direction];

  if (!selectedWeek || !neighborWeek) {
    return false;
  }

  return (
    selectedWeek.days.every(canEditDay) && neighborWeek.days.every(canEditDay)
  );
}

function canDeleteSelectedWeek(
  plan: WorkoutPlan,
  weekIndex: number,
  canEditDay: (day: Day) => boolean,
): boolean {
  if (!canRemoveWeek(plan)) {
    return false;
  }

  const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
  return Boolean(week?.days.every(canEditDay));
}

export function PlanStructureControls({
  plan,
  selectedWeekIndex,
  selectedDayIndex,
  disabled,
  onPlanChange,
  onSelectionChange,
  layout = "desktop",
  canEditDay = () => true,
}: {
  plan: WorkoutPlan;
  selectedWeekIndex: number;
  selectedDayIndex: number;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
  onSelectionChange: (selection: DaySelection) => void;
  layout?: "desktop" | "mobile";
  canEditDay?: (day: Day) => boolean;
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

  function handleMoveWeek(direction: -1 | 1) {
    if (!canMoveSelectedWeek(plan, selectedWeekIndex, direction, canEditDay)) {
      return;
    }

    const weekPosition = getWeekArrayIndex(plan, selectedWeekIndex);
    const nextPlan = moveWeek(plan, selectedWeekIndex, direction);
    if (!nextPlan) {
      return;
    }

    onPlanChange(nextPlan);
    onSelectionChange(resolveSelectionAfterMoveWeek(nextPlan, weekPosition + direction));
  }

  function handleMoveDay(direction: -1 | 1) {
    if (
      !selectedLocation ||
      !canMoveSelectedDay(plan, selectedWeekIndex, selectedDayIndex, direction, canEditDay)
    ) {
      return;
    }

    const nextPlan = moveDay(plan, selectedWeekIndex, selectedDayIndex, direction);
    if (!nextPlan) {
      return;
    }

    const week = nextPlan.weeks.find((candidate) => candidate.index === selectedWeekIndex);
    const dayPosition = week
      ? week.days.findIndex((day) => day.index === selectedDayIndex)
      : -1;

    onPlanChange(nextPlan);
    if (dayPosition !== -1) {
      onSelectionChange(
        resolveSelectionAfterMoveDay(nextPlan, selectedWeekIndex, dayPosition),
      );
    }
  }

  function requestRemoveWeek() {
    if (!canDeleteSelectedWeek(plan, selectedWeekIndex, canEditDay)) {
      return;
    }

    if (shouldConfirmDeleteWeek(plan, selectedWeekIndex)) {
      setPendingDelete({ type: "week" });
      return;
    }

    executeRemoveWeek();
  }

  function requestRemoveDay() {
    if (
      !canRemoveDay(plan, selectedWeekIndex) ||
      !selectedLocation ||
      !canEditDay(selectedLocation.day)
    ) {
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
          ? "flex min-w-0 flex-1 items-center gap-2"
          : "flex items-center gap-2"
      }
    >
      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronUpIcon className="h-4 w-4" />}
        aria-label="Move week up"
        disabled={
          disabled || !canMoveSelectedWeek(plan, selectedWeekIndex, -1, canEditDay)
        }
        onClick={() => handleMoveWeek(-1)}
      />
      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronDownIcon className="h-4 w-4" />}
        aria-label="Move week down"
        disabled={
          disabled || !canMoveSelectedWeek(plan, selectedWeekIndex, 1, canEditDay)
        }
        onClick={() => handleMoveWeek(1)}
      />
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
        icon={<XIcon />}
        disabled={disabled || !canDeleteSelectedWeek(plan, selectedWeekIndex, canEditDay)}
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
          ? "flex min-w-0 flex-1 items-center gap-2"
          : "flex items-center gap-2"
      }
    >
      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronUpIcon className="h-4 w-4" />}
        aria-label="Move day up"
        disabled={
          disabled ||
          !canMoveSelectedDay(plan, selectedWeekIndex, selectedDayIndex, -1, canEditDay)
        }
        onClick={() => handleMoveDay(-1)}
      />
      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronDownIcon className="h-4 w-4" />}
        aria-label="Move day down"
        disabled={
          disabled ||
          !canMoveSelectedDay(plan, selectedWeekIndex, selectedDayIndex, 1, canEditDay)
        }
        onClick={() => handleMoveDay(1)}
      />
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
        icon={<XIcon />}
        disabled={
          disabled ||
          !canRemoveDay(plan, selectedWeekIndex) ||
          !selectedLocation ||
          !canEditDay(selectedLocation.day)
        }
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
