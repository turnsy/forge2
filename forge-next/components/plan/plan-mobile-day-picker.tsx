"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon } from "@/components/icons/arrow-left-icon";
import { ArrowRightIcon } from "@/components/icons/arrow-right-icon";
import { ChevronDownIcon } from "@/components/icons/chevron-down-icon";
import { IconButton } from "@/components/ui/icon-button";
import { PillButton } from "@/components/ui/pill-button";
import {
  buildPlanDayNavItems,
  getAdjacentDaySelection,
  getDayDropdownLabel,
  getMobileDayHeaderLabel,
  getWeekDropdownLabel,
  type DaySelection,
} from "@/lib/plans/plan-day-navigator";
import { radius } from "@/lib/theme";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const dropdownPanelClass = [
  radius.card,
  "border border-glass-border bg-surface/95 shadow-xl backdrop-blur-md",
].join(" ");

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
  const containerRef = useRef<HTMLDivElement>(null);
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

  function toggleDropdown() {
    setOpen((current) => !current);
  }

  function handleSelectDay(weekIndex: number, dayIndex: number) {
    onSelect({ weekIndex, dayIndex });
    setOpen(false);
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
          className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2 py-2.5 text-sm font-medium text-surface-foreground"
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

      {open ? (
        <div
          id={dropdownId}
          role="listbox"
          aria-label="Plan days"
          className={`absolute top-[calc(100%+0.5rem)] z-20 max-h-[min(24rem,60vh)] w-full overflow-y-auto p-3 ${dropdownPanelClass}`}
        >
          <div className="flex flex-col gap-4">
            {plan.weeks.map((week) => (
              <section key={week.index} aria-label={getWeekDropdownLabel(week)}>
                <h3 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-surface-muted">
                  {getWeekDropdownLabel(week)}
                </h3>
                <div
                  className="grid w-full gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${week.days.length}, minmax(0, 1fr))`,
                  }}
                >
                  {week.days.map((day) => {
                    const isSelected =
                      week.index === selectedWeekIndex && day.index === selectedDayIndex;

                    return (
                      <PillButton
                        key={day.code}
                        type="button"
                        role="option"
                        selected={isSelected}
                        aria-selected={isSelected}
                        className="w-full"
                        onClick={() => handleSelectDay(week.index, day.index)}
                      >
                        {getDayDropdownLabel(day)}
                      </PillButton>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
