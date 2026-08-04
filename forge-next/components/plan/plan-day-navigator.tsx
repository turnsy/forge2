"use client";

import { useMemo, useState } from "react";
import { PlanDayView } from "@/components/plan/plan-day-view";
import { PlanMobileDayPicker } from "@/components/plan/plan-mobile-day-picker";
import { PlanStructureControls } from "@/components/plan/plan-structure-controls";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import { PageHeader, Select } from "@/components/ui";
import type { CurrentDayLocation } from "@/lib/athlete/plan/domain";
import {
  clampDaySelectionForWeek,
  getDayDropdownLabel,
  getInitialDaySelection,
  getWeekDropdownLabel,
  type DaySelection,
} from "@/lib/plans/plan-day-navigator";
import type { Day, WorkoutPlan } from "@/lib/plans/workout-plan";
import type { MaxValue } from "@/lib/maxes/compute-weight";

export type PlanDayNavigatorProps = {
  plan: WorkoutPlan;
  view: PlanViewerView;
  initialDay?: DaySelection;
  assignmentId?: string;
  coachName?: string;
  readOnly?: boolean;
  onDayCompleted?: (
    allDaysDone: boolean,
    completedDay: CurrentDayLocation,
    plan: WorkoutPlan,
  ) => void;
  onPlanChange?: (plan: WorkoutPlan) => void;
  disabled?: boolean;
  canEditDay?: (day: Day) => boolean;
  maxesByExerciseId?: Record<string, MaxValue>;
};

function SaveIndicator({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error";
}) {
  if (status === "idle") {
    return null;
  }

  const label =
    status === "saving"
      ? "Saving..."
      : status === "saved"
        ? "Saved"
        : "Save failed";

  return (
    <span
      className={`text-xs ${
        status === "error"
          ? "text-red-600 dark:text-red-400"
          : "text-zinc-500 dark:text-zinc-400"
      }`}
      aria-live="polite"
    >
      {label}
    </span>
  );
}

export function PlanDayNavigator({
  plan,
  view,
  initialDay,
  assignmentId,
  readOnly = false,
  onDayCompleted,
  onPlanChange,
  disabled = false,
  canEditDay,
  maxesByExerciseId = {},
}: PlanDayNavigatorProps) {
  const defaultSelection = useMemo(
    () => getInitialDaySelection(plan, view, initialDay),
    [plan, view, initialDay],
  );

  const [selectedWeekPos, setSelectedWeekPos] = useState(defaultSelection.weekPos);
  const [selectedDayPos, setSelectedDayPos] = useState(defaultSelection.dayPos);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const selectionKey = `${selectedWeekPos}-${selectedDayPos}`;

  function handleWeekChange(weekPos: number) {
    const week = plan.weeks[weekPos];
    if (!week) {
      return;
    }

    const nextDayPos = clampDaySelectionForWeek(week, selectedDayPos);
    setSelectedWeekPos(weekPos);
    setSelectedDayPos(nextDayPos);
  }

  function handleDayChange(dayPos: number) {
    setSelectedDayPos(dayPos);
  }

  function handleMobileSelect({ weekPos, dayPos }: DaySelection) {
    setSelectedWeekPos(weekPos);
    setSelectedDayPos(dayPos);
  }

  const selectedWeek = plan.weeks[selectedWeekPos];
  const weekOptions = plan.weeks.map((week, weekPos) => ({
    weekPos,
    label: getWeekDropdownLabel(week, weekPos),
  }));
  const dayOptions =
    selectedWeek?.days.map((day, dayPos) => ({
      dayPos,
      label: getDayDropdownLabel(day, dayPos),
    })) ?? [];

  const showStructureControls = view === "coach" && !readOnly && Boolean(onPlanChange);

  const handlePlanStructureChange = (nextPlan: WorkoutPlan) => {
    onPlanChange?.(nextPlan);
  };

  const handleDayCompleted = (allDaysDone: boolean, nextPlan: WorkoutPlan) => {
    if (!onDayCompleted) {
      return;
    }

    const week = nextPlan.weeks[selectedWeekPos];
    const day = week?.days[selectedDayPos];
    if (!week || !day) {
      return;
    }

    onDayCompleted(allDaysDone, {
      weekPos: selectedWeekPos,
      dayPos: selectedDayPos,
      week,
      day,
    }, nextPlan);
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {view === "athlete" && !readOnly ? (
        <PageHeader
          title={plan.name}
          actions={<SaveIndicator status={saveStatus} />}
        />
      ) : null}

      <div className="space-y-3">
        <div className="hidden md:flex md:flex-col md:gap-3">
          <div className="flex items-center gap-3">
            <Select
              label="Week"
              hideLabel
              size="sm"
              wrapperClassName="min-w-0 flex-1"
              value={selectedWeekPos}
              onChange={(event) => handleWeekChange(Number(event.target.value))}
            >
              {weekOptions.map((option) => (
                <option key={option.weekPos} value={option.weekPos}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Day"
              hideLabel
              size="sm"
              wrapperClassName="min-w-0 flex-1"
              value={selectedDayPos}
              onChange={(event) => handleDayChange(Number(event.target.value))}
            >
              {dayOptions.map((option) => (
                <option key={option.dayPos} value={option.dayPos}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          {showStructureControls ? (
            <PlanStructureControls
              plan={plan}
              selectedWeekPos={selectedWeekPos}
              selectedDayPos={selectedDayPos}
              disabled={disabled}
              canEditDay={canEditDay}
              onPlanChange={handlePlanStructureChange}
              onSelectionChange={({ weekPos, dayPos }) => {
                setSelectedWeekPos(weekPos);
                setSelectedDayPos(dayPos);
              }}
            />
          ) : null}
        </div>

        <PlanMobileDayPicker
          plan={plan}
          selectedWeekPos={selectedWeekPos}
          selectedDayPos={selectedDayPos}
          onSelect={handleMobileSelect}
        />
        {showStructureControls ? (
          <div className="md:hidden">
            <PlanStructureControls
              plan={plan}
              selectedWeekPos={selectedWeekPos}
              selectedDayPos={selectedDayPos}
              disabled={disabled}
              layout="mobile"
              canEditDay={canEditDay}
              onPlanChange={handlePlanStructureChange}
              onSelectionChange={({ weekPos, dayPos }) => {
                setSelectedWeekPos(weekPos);
                setSelectedDayPos(dayPos);
              }}
            />
          </div>
        ) : null}
      </div>

      <PlanDayView
        key={selectionKey}
        plan={plan}
        weekPos={selectedWeekPos}
        dayPos={selectedDayPos}
        view={view}
        readOnly={readOnly}
        assignmentId={assignmentId}
        onPlanChange={onPlanChange}
        disabled={disabled}
        maxesByExerciseId={maxesByExerciseId}
        onDayCompleted={
          view === "athlete" && !readOnly
            ? handleDayCompleted
            : undefined
        }
        onSaveStatusChange={view === "athlete" && !readOnly ? setSaveStatus : undefined}
      />
    </div>
  );
}
