"use client";

import { ChevronDownIcon } from "@/components/icons/chevron-down-icon";
import { ChevronUpIcon } from "@/components/icons/chevron-up-icon";
import { PlusIcon } from "@/components/icons/plus-icon";
import { XIcon } from "@/components/icons/x-icon";
import { Button, IconButton } from "@/components/ui";
import type { DaySelection } from "@/lib/plans/plan-day-navigator";
import {
  addDay,
  addWeek,
  canMoveDay,
  canMoveWeek,
  canRemoveDay,
  canRemoveWeek,
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
import { resolveDayLocation } from "@/lib/plans/plan-day-navigator";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function StructureControlButtons({
  disabled,
  canMoveUp,
  canMoveDown,
  canRemove,
  removeLabel,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  disabled: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  removeLabel: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronUpIcon className="h-4 w-4" />}
        aria-label={`Move ${removeLabel.toLowerCase()} up`}
        disabled={disabled || !canMoveUp}
        onClick={onMoveUp}
      />
      <IconButton
        variant="ghost"
        size="sm"
        icon={<ChevronDownIcon className="h-4 w-4" />}
        aria-label={`Move ${removeLabel.toLowerCase()} down`}
        disabled={disabled || !canMoveDown}
        onClick={onMoveDown}
      />
      <IconButton
        variant="danger"
        size="sm"
        icon={<XIcon className="h-4 w-4" />}
        aria-label={`Delete ${removeLabel.toLowerCase()}`}
        disabled={disabled || !canRemove}
        onClick={onRemove}
      />
    </div>
  );
}

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

  function handleRemoveWeek() {
    if (weekArrayIndex === -1) {
      return;
    }

    if (
      shouldConfirmDeleteWeek(plan, selectedWeekIndex) &&
      !window.confirm("Delete this week and all of its days?")
    ) {
      return;
    }

    const nextPlan = removeWeek(plan, selectedWeekIndex);
    if (!nextPlan) {
      return;
    }

    onPlanChange(nextPlan);
    onSelectionChange(resolveSelectionAfterRemoveWeek(nextPlan, weekArrayIndex));
  }

  function handleRemoveDay() {
    if (!selectedLocation || dayArrayIndex === -1) {
      return;
    }

    if (
      shouldConfirmDeleteDay(selectedLocation.day) &&
      !window.confirm("Delete this day and all of its exercises?")
    ) {
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
    if (weekArrayIndex === -1) {
      return;
    }

    const nextPlan = moveWeek(plan, selectedWeekIndex, direction);
    if (!nextPlan) {
      return;
    }

    onPlanChange(nextPlan);
    onSelectionChange(
      resolveSelectionAfterMoveWeek(nextPlan, weekArrayIndex + direction),
    );
  }

  function handleMoveDay(direction: -1 | 1) {
    if (dayArrayIndex === -1) {
      return;
    }

    const nextPlan = moveDay(plan, selectedWeekIndex, selectedDayIndex, direction);
    if (!nextPlan) {
      return;
    }

    onPlanChange(nextPlan);
    onSelectionChange(
      resolveSelectionAfterMoveDay(nextPlan, selectedWeekIndex, dayArrayIndex + direction),
    );
  }

  const weekControls = (
    <div className={layout === "desktop" ? "flex min-w-0 flex-1 items-center gap-2" : "flex items-center gap-2"}>
      <StructureControlButtons
        disabled={disabled}
        canMoveUp={canMoveWeek(plan, selectedWeekIndex, -1)}
        canMoveDown={canMoveWeek(plan, selectedWeekIndex, 1)}
        canRemove={canRemoveWeek(plan)}
        removeLabel="Week"
        onMoveUp={() => handleMoveWeek(-1)}
        onMoveDown={() => handleMoveWeek(1)}
        onRemove={handleRemoveWeek}
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
    </div>
  );

  const dayControls = (
    <div className={layout === "desktop" ? "flex min-w-0 flex-1 items-center gap-2" : "flex items-center gap-2"}>
      <StructureControlButtons
        disabled={disabled}
        canMoveUp={canMoveDay(plan, selectedWeekIndex, selectedDayIndex, -1)}
        canMoveDown={canMoveDay(plan, selectedWeekIndex, selectedDayIndex, 1)}
        canRemove={canRemoveDay(plan, selectedWeekIndex)}
        removeLabel="Day"
        onMoveUp={() => handleMoveDay(-1)}
        onMoveDown={() => handleMoveDay(1)}
        onRemove={handleRemoveDay}
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
    </div>
  );

  if (layout === "mobile") {
    return (
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
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {weekControls}
      {dayControls}
    </div>
  );
}
