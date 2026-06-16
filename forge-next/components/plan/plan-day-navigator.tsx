"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlanDayView } from "@/components/plan/plan-day-view";
import type { PlanViewerView } from "@/components/plan/plan-set-table";
import { PageHeader } from "@/components/ui";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import type { CurrentDayLocation } from "@/lib/athlete/plan/domain";
import {
  buildPlanDayNavItems,
  clampDaySelectionForWeek,
  getDayDropdownLabel,
  getInitialDaySelection,
  getMobileDayLabel,
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
  onDayCompleted?: (allDaysDone: boolean, completedDay: CurrentDayLocation) => void;
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
}: PlanDayNavigatorProps) {
  const isMobile = useIsMobile();
  const navItems = useMemo(() => buildPlanDayNavItems(plan), [plan]);
  const defaultSelection = useMemo(
    () => getInitialDaySelection(plan, view, initialDay),
    [plan, view, initialDay],
  );

  const [selectedWeekIndex, setSelectedWeekIndex] = useState(defaultSelection.weekIndex);
  const [selectedDayIndex, setSelectedDayIndex] = useState(defaultSelection.dayIndex);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const selectionKey = `${selectedWeekIndex}-${selectedDayIndex}`;

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    const key = `${selectedWeekIndex}-${selectedDayIndex}`;
    const tile = tileRefs.current[key];
    const container = scrollContainerRef.current;

    if (!tile || !container) {
      return;
    }

    const tileLeft = tile.offsetLeft;
    const tileWidth = tile.offsetWidth;
    const containerWidth = container.offsetWidth;
    const scrollLeft = tileLeft - containerWidth / 2 + tileWidth / 2;

    container.scrollTo?.({ left: scrollLeft, behavior: "smooth" });
  }, [isMobile, selectedWeekIndex, selectedDayIndex]);

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

  function handleMobileSelect(weekIndex: number, dayIndex: number) {
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

  const handleDayCompleted = (allDaysDone: boolean) => {
    if (!onDayCompleted || !selectedWeek) {
      return;
    }

    const day = selectedWeek.days.find((candidate) => candidate.index === selectedDayIndex);
    if (!day) {
      return;
    }

    onDayCompleted(allDaysDone, {
      weekIndex: selectedWeekIndex,
      dayIndex: selectedDayIndex,
      week: selectedWeek,
      day,
    });
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
        <div className="hidden items-center gap-3 md:flex">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="sr-only">Week</span>
            <select
              aria-label="Week"
              className="rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-surface-foreground"
              value={selectedWeekIndex}
              onChange={(event) => handleWeekChange(Number(event.target.value))}
            >
              {weekOptions.map((option) => (
                <option key={option.index} value={option.index}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="sr-only">Day</span>
            <select
              aria-label="Day"
              className="rounded-md border border-surface-border bg-surface px-3 py-2 text-sm text-surface-foreground"
              value={selectedDayIndex}
              onChange={(event) => handleDayChange(Number(event.target.value))}
            >
              {dayOptions.map((option) => (
                <option key={option.index} value={option.index}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto pb-1 md:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {navItems.map((item) => {
            const key = `${item.weekIndex}-${item.dayIndex}`;
            const isSelected =
              item.weekIndex === selectedWeekIndex && item.dayIndex === selectedDayIndex;

            return (
              <button
                key={key}
                ref={(node) => {
                  tileRefs.current[key] = node;
                }}
                type="button"
                aria-label={getMobileDayLabel(item.weekIndex, item.dayIndex)}
                aria-current={isSelected ? "true" : undefined}
                className={`w-[4.5em] shrink-0 rounded-full border px-2 py-1.5 text-center text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-surface-foreground bg-surface-foreground text-background"
                    : "border-surface-border bg-surface text-surface-foreground"
                }`}
                style={{ scrollSnapAlign: "center" }}
                onClick={() => handleMobileSelect(item.weekIndex, item.dayIndex)}
              >
                {getMobileDayLabel(item.weekIndex, item.dayIndex)}
              </button>
            );
          })}
        </div>
      </div>

      <PlanDayView
        key={selectionKey}
        plan={plan}
        weekIndex={selectedWeekIndex}
        dayIndex={selectedDayIndex}
        view={view}
        readOnly={readOnly}
        assignmentId={assignmentId}
        onDayCompleted={
          view === "athlete" && !readOnly
            ? (allDaysDone) => handleDayCompleted(allDaysDone)
            : undefined
        }
        onSaveStatusChange={view === "athlete" && !readOnly ? setSaveStatus : undefined}
      />
    </div>
  );
}
