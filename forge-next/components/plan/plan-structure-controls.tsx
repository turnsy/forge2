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
  canMoveDay,
  canMoveWeek,
  canRemoveDay,
  canRemoveWeek,
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
  weekPos: number,
  dayPos: number,
  direction: -1 | 1,
  canEditDay: (day: Day) => boolean,
): boolean {
  if (!canMoveDay(plan, weekPos, dayPos, direction)) {
    return false;
  }

  const week = plan.weeks[weekPos];
  const selectedDay = week?.days[dayPos];
  const neighborDay = week?.days[dayPos + direction];

  if (!selectedDay || !neighborDay) {
    return false;
  }

  return canEditDay(selectedDay) && canEditDay(neighborDay);
}

function canMoveSelectedWeek(
  plan: WorkoutPlan,
  weekPos: number,
  direction: -1 | 1,
  canEditDay: (day: Day) => boolean,
): boolean {
  if (!canMoveWeek(plan, weekPos, direction)) {
    return false;
  }

  const selectedWeek = plan.weeks[weekPos];
  const neighborWeek = plan.weeks[weekPos + direction];

  if (!selectedWeek || !neighborWeek) {
    return false;
  }

  return (
    selectedWeek.days.every(canEditDay) && neighborWeek.days.every(canEditDay)
  );
}

function canDeleteSelectedWeek(
  plan: WorkoutPlan,
  weekPos: number,
  canEditDay: (day: Day) => boolean,
): boolean {
  if (!canRemoveWeek(plan)) {
    return false;
  }

  const week = plan.weeks[weekPos];
  return Boolean(week?.days.every(canEditDay));
}

export function PlanStructureControls({
  plan,
  selectedWeekPos,
  selectedDayPos,
  disabled,
  onPlanChange,
  onSelectionChange,
  layout = "desktop",
  canEditDay = () => true,
}: {
  plan: WorkoutPlan;
  selectedWeekPos: number;
  selectedDayPos: number;
  disabled: boolean;
  onPlanChange: (plan: WorkoutPlan) => void;
  onSelectionChange: (selection: DaySelection) => void;
  layout?: "desktop" | "mobile";
  canEditDay?: (day: Day) => boolean;
}) {
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const selectedLocation = resolveDayLocation(plan, selectedWeekPos, selectedDayPos);

  function handleAddWeek() {
    const nextPlan = addWeek(plan);
    onPlanChange(nextPlan);
    onSelectionChange(resolveSelectionAfterAddWeek(nextPlan));
  }

  function handleAddDay() {
    const nextPlan = addDay(plan, selectedWeekPos);
    onPlanChange(nextPlan);
    onSelectionChange(resolveSelectionAfterAddDay(nextPlan, selectedWeekPos));
  }

  function executeRemoveWeek() {
    const nextPlan = removeWeek(plan, selectedWeekPos);
    if (!nextPlan) {
      return;
    }

    onPlanChange(nextPlan);
    onSelectionChange(resolveSelectionAfterRemoveWeek(nextPlan, selectedWeekPos));
  }

  function executeRemoveDay() {
    if (!selectedLocation) {
      return;
    }

    const nextPlan = removeDay(plan, selectedWeekPos, selectedDayPos);
    if (!nextPlan) {
      return;
    }

    onPlanChange(nextPlan);
    onSelectionChange(
      resolveSelectionAfterRemoveDay(nextPlan, selectedWeekPos, selectedDayPos),
    );
  }

  function handleMoveWeek(direction: -1 | 1) {
    if (!canMoveSelectedWeek(plan, selectedWeekPos, direction, canEditDay)) {
      return;
    }

    const nextPlan = moveWeek(plan, selectedWeekPos, direction);
    if (!nextPlan) {
      return;
    }

    onPlanChange(nextPlan);
    onSelectionChange(resolveSelectionAfterMoveWeek(nextPlan, selectedWeekPos + direction));
  }

  function handleMoveDay(direction: -1 | 1) {
    if (
      !selectedLocation ||
      !canMoveSelectedDay(plan, selectedWeekPos, selectedDayPos, direction, canEditDay)
    ) {
      return;
    }

    const nextPlan = moveDay(plan, selectedWeekPos, selectedDayPos, direction);
    if (!nextPlan) {
      return;
    }

    onPlanChange(nextPlan);
    onSelectionChange(
      resolveSelectionAfterMoveDay(selectedWeekPos, selectedDayPos + direction),
    );
  }

  function requestRemoveWeek() {
    if (!canDeleteSelectedWeek(plan, selectedWeekPos, canEditDay)) {
      return;
    }

    if (shouldConfirmDeleteWeek(plan, selectedWeekPos)) {
      setPendingDelete({ type: "week" });
      return;
    }

    executeRemoveWeek();
  }

  function requestRemoveDay() {
    if (
      !canRemoveDay(plan, selectedWeekPos) ||
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
          disabled || !canMoveSelectedWeek(plan, selectedWeekPos, -1, canEditDay)
        }
        onClick={() => handleMoveWeek(-1)}
      />
      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronDownIcon className="h-4 w-4" />}
        aria-label="Move week down"
        disabled={
          disabled || !canMoveSelectedWeek(plan, selectedWeekPos, 1, canEditDay)
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
        disabled={disabled || !canDeleteSelectedWeek(plan, selectedWeekPos, canEditDay)}
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
          !canMoveSelectedDay(plan, selectedWeekPos, selectedDayPos, -1, canEditDay)
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
          !canMoveSelectedDay(plan, selectedWeekPos, selectedDayPos, 1, canEditDay)
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
          !canRemoveDay(plan, selectedWeekPos) ||
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
        description="This day and all of its blocks will be removed from the plan."
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
