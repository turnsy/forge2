"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon } from "@/components/icons/arrow-left-icon";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { ChevronDownIcon } from "@/components/icons/chevron-down-icon";
import { IconButton } from "@/components/ui/icon-button";
import {
  buildPlanDayNavItems,
  getAdjacentDaySelection,
  getAdjacentWeekIndex,
  getDayDropdownLabel,
  getMobileDayHeaderLabel,
  getWeekDropdownLabel,
  type DaySelection,
} from "@/lib/plans/plan-day-navigator";
import { glassSurfaceClass } from "@/lib/theme";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const SWIPE_THRESHOLD_PX = 48;

export function PlanMobileDayPicker({
  plan,
  selectedWeekIndex,
  selectedDayIndex,
  onSelect,
}: {
  plan: WorkoutPlan;
  selectedWeekIndex: number;
  selectedDayIndex: number;
  onSelect: (selection: DaySelection) => void;
}) {
  const navItems = useMemo(() => buildPlanDayNavItems(plan), [plan]);
  const [open, setOpen] = useState(false);
  const [previewWeekIndex, setPreviewWeekIndex] = useState(selectedWeekIndex);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const dropdownId = useId();

  const previousSelection = getAdjacentDaySelection(
    navItems,
    selectedWeekIndex,
    selectedDayIndex,
    "prev",
  );
  const nextSelection = getAdjacentDaySelection(
    navItems,
    selectedWeekIndex,
    selectedDayIndex,
    "next",
  );

  const previewWeek = plan.weeks.find((week) => week.index === previewWeekIndex);
  const headerLabel = getMobileDayHeaderLabel(selectedWeekIndex, selectedDayIndex);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function openDropdown() {
    setPreviewWeekIndex(selectedWeekIndex);
    setOpen(true);
  }

  function toggleDropdown() {
    if (open) {
      setOpen(false);
      return;
    }

    openDropdown();
  }

  function handleSelectDay(weekIndex: number, dayIndex: number) {
    onSelect({ weekIndex, dayIndex });
    setOpen(false);
  }

  function handlePreviewWeekChange(direction: "prev" | "next") {
    const nextWeekIndex = getAdjacentWeekIndex(plan, previewWeekIndex, direction);
    if (nextWeekIndex !== null) {
      setPreviewWeekIndex(nextWeekIndex);
    }
  }

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null) {
      return;
    }

    const endX = event.changedTouches[0]?.clientX;
    if (endX === undefined) {
      touchStartX.current = null;
      return;
    }

    const delta = endX - touchStartX.current;
    if (delta > SWIPE_THRESHOLD_PX) {
      handlePreviewWeekChange("prev");
    } else if (delta < -SWIPE_THRESHOLD_PX) {
      handlePreviewWeekChange("next");
    }

    touchStartX.current = null;
  }

  return (
    <div ref={containerRef} className="relative md:hidden">
      <div className="flex items-center gap-2">
        <IconButton
          variant="ghost"
          size="sm"
          icon={<ArrowLeftIcon />}
          aria-label="Previous day"
          disabled={!previousSelection}
          onClick={() => {
            if (previousSelection) {
              onSelect(previousSelection);
            }
          }}
        />

        <button
          type="button"
          aria-expanded={open}
          aria-controls={dropdownId}
          onClick={toggleDropdown}
          className={`flex min-w-0 flex-1 items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-surface-foreground ${glassSurfaceClass()}`}
        >
          <span className="truncate">{headerLabel}</span>
          <ChevronDownIcon
            className={`text-surface-muted transition-transform duration-300 ease-out motion-reduce:transition-none ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        <IconButton
          variant="ghost"
          size="sm"
          icon={<ArrowRightIcon />}
          aria-label="Next day"
          disabled={!nextSelection}
          onClick={() => {
            if (nextSelection) {
              onSelect(nextSelection);
            }
          }}
        />
      </div>

      {open && previewWeek ? (
        <div
          id={dropdownId}
          role="listbox"
          aria-label={`${getWeekDropdownLabel(previewWeek)} days`}
          className={`absolute top-[calc(100%+0.5rem)] z-20 w-full p-2 ${glassSurfaceClass()}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <p className="px-2 pb-2 text-xs font-medium text-surface-muted">
            {getWeekDropdownLabel(previewWeek)}
          </p>
          <div className="flex flex-col gap-1">
            {previewWeek.days.map((day) => {
              const isSelected =
                previewWeek.index === selectedWeekIndex && day.index === selectedDayIndex;

              return (
                <button
                  key={day.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectDay(previewWeek.index, day.index)}
                  className={`rounded-card px-3 py-2 text-left text-sm font-medium transition ${
                    isSelected
                      ? "bg-glass-focus text-surface-foreground"
                      : "text-surface-muted hover:bg-glass-focus/60 hover:text-surface-foreground"
                  }`}
                >
                  {getDayDropdownLabel(day)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
