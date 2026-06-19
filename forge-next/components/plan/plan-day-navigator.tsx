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
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

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
}: PlanDayNavigatorProps) {
  const defaultSelection = useMemo(
    () => getInitialDaySelection(plan, view, initialDay),
    [plan, view, initialDay],
  );

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(defaultSelection.weekIndex);
  const [selectedDayIndex, setSelectedDayIndex] = useState(defaultSelection.dayIndex);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const selectionKey = `${selectedWeekIndex}-${selectedDayIndex}`;

  function handleWeekChange(weekIndex: number) {
    const week = plan.weeks.find((candidate) => candidate.index === weekIndex);
    if (!week) {
      return;
    }

    const nextDayIndex = clampDaySelectionForWeek(week, 1);
    setSelectedWeekIndex(weekIndex);
    setSelectedDayIndex(nextDayIndex);
  }

  function handleDayChange(dayIndex: number) {
    setSelectedDayIndex(dayIndex);
  }

  function handleMobileSelect({ weekIndex, dayIndex }: DaySelection) {
    setSelectedWeekIndex(weekIndex);
    setSelectedDayIndex(dayIndex);
  }

  const selectedWeek = plan.weeks.find((week) => week.index === selectedWeekIndex);
  const weekOptions = plan.weeks.map((week) => ({
    index: week.index,
    label: getWeekDropdownLabel(week),
  }));
  const dayOptions =
    selectedWeek?.days.map((day) => ({
      index: day.index,
      label: getDayDropdownLabel(day),
    })) ?? [];

  const showStructureControls = view === "coach" && !readOnly && Boolean(onPlanChange);

  const handlePlanStructureChange = (nextPlan: WorkoutPlan) => {
    onPlanChange?.(nextPlan);
  };

  const handleDayCompleted = (allDaysDone: boolean, plan: WorkoutPlan) => {
    if (!onDayCompleted || !selectedWeek) {
      return;
    }

    const week = plan.weeks.find((candidate) => candidate.index === selectedWeekIndex);
    const day = week?.days.find((candidate) => candidate.index === selectedDayIndex);
    if (!week || !day) {
      return;
    }

    onDayCompleted(allDaysDone, {
      weekIndex: selectedWeekIndex,
      dayIndex: selectedDayIndex,
      week,
      day,
    }, plan);
  };

  return (
    <div className="flex flex-col gap-6">
      {view === "athlete" ? (
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
              value={selectedWeekIndex}
              onChange={(event) => handleWeekChange(Number(event.target.value))}
            >
              {weekOptions.map((option) => (
                <option key={option.index} value={option.index}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select
              label="Day"
              hideLabel
              size="sm"
              wrapperClassName="min-w-0 flex-1"
              value={selectedDayIndex}
              onChange={(event) => handleDayChange(Number(event.target.value))}
            >
              {dayOptions.map((option) => (
                <option key={option.index} value={option.index}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          {showStructureControls ? (
            <PlanStructureControls
              plan={plan}
              selectedWeekIndex={selectedWeekIndex}
              selectedDayIndex={selectedDayIndex}
              disabled={disabled}
              onPlanChange={handlePlanStructureChange}
              onSelectionChange={({ weekIndex, dayIndex }) => {
                setSelectedWeekIndex(weekIndex);
                setSelectedDayIndex(dayIndex);
              }}
            />
          ) : null}
        </div>

        <PlanMobileDayPicker
          plan={plan}
          selectedWeekIndex={selectedWeekIndex}
          selectedDayIndex={selectedDayIndex}
          onSelect={handleMobileSelect}
        />
        {showStructureControls ? (
          <div className="md:hidden">
            <PlanStructureControls
              plan={plan}
              selectedWeekIndex={selectedWeekIndex}
              selectedDayIndex={selectedDayIndex}
              disabled={disabled}
              layout="mobile"
              onPlanChange={handlePlanStructureChange}
              onSelectionChange={({ weekIndex, dayIndex }) => {
                setSelectedWeekIndex(weekIndex);
                setSelectedDayIndex(dayIndex);
              }}
            />
          </div>
        ) : null}
      </div>

      <PlanDayView
        key={selectionKey}
        plan={plan}
        weekIndex={selectedWeekIndex}
        dayIndex={selectedDayIndex}
        view={view}
        readOnly={readOnly}
        assignmentId={assignmentId}
        onPlanChange={onPlanChange}
        disabled={disabled}
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
