"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Input, Select } from "@/components/ui";
import {
  CUSTOM_LOAD_UNIT_OPTION,
  isPresetLoadUnit,
  PRESET_LOAD_UNITS,
} from "@/lib/plans/load-units";
import {
  disablePercentageLoad,
  enablePercentageLoad,
  getAbsoluteUnitForLoad,
  getLoadTargetValue,
  isPercentageLoad,
  updateAbsoluteLoadUnit,
  updateLoadTargetValue,
} from "@/lib/plans/percentage-load";
import type { Load } from "@/lib/plans/workout-plan";

const unitControlClass = "w-[4.75rem] shrink-0";

function LoadUnitControl({
  unit,
  disabled,
  onChange,
}: {
  unit: string;
  disabled: boolean;
  onChange: (unit: string) => void;
}) {
  const [customActive, setCustomActive] = useState(() => !isPresetLoadUnit(unit));
  const [customDraft, setCustomDraft] = useState(() =>
    !isPresetLoadUnit(unit) ? unit : "",
  );
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (customActive) {
      customInputRef.current?.focus();
    }
  }, [customActive]);

  function enterCustomMode() {
    setCustomDraft(isPresetLoadUnit(unit) ? "" : unit);
    setCustomActive(true);
  }

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (next === CUSTOM_LOAD_UNIT_OPTION) {
      enterCustomMode();
      return;
    }

    setCustomActive(false);
    onChange(next);
  }

  function handleCustomBlur() {
    const trimmed = customDraft.trim();
    if (!trimmed || isPresetLoadUnit(trimmed)) {
      setCustomActive(false);
      onChange("lb");
      return;
    }

    if (trimmed !== unit) {
      onChange(trimmed);
    }
  }

  const selectValue = customActive ? CUSTOM_LOAD_UNIT_OPTION : unit;

  if (customActive) {
    return (
      <div className={unitControlClass}>
        <Input
          ref={customInputRef}
          size="sm"
          value={customDraft}
          disabled={disabled}
          aria-label="Custom unit"
          placeholder="e.g. mi"
          className="w-full min-w-0"
          onChange={(event) => {
            const next = event.target.value;
            setCustomDraft(next);
            onChange(next);
          }}
          onBlur={handleCustomBlur}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setCustomActive(false);
              onChange("lb");
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={unitControlClass}>
      <Select
        hideLabel
        label="Unit"
        size="sm"
        value={selectValue}
        disabled={disabled}
        className="w-full"
        onChange={handleSelectChange}
      >
        {PRESET_LOAD_UNITS.map((preset) => (
          <option key={preset} value={preset}>
            {preset}
          </option>
        ))}
        <option value={CUSTOM_LOAD_UNIT_OPTION}>Custom</option>
      </Select>
    </div>
  );
}

export type PlanLoadTargetControlProps = {
  load: Load;
  disabled: boolean;
  setNumber: number;
  onChange: (load: Load) => void;
};

export function PlanLoadTargetControl({
  load,
  disabled,
  setNumber,
  onChange,
}: PlanLoadTargetControlProps) {
  const isPercentage = isPercentageLoad(load);
  const displayUnit = getAbsoluteUnitForLoad(load);

  function handleTogglePercentage() {
    if (isPercentage) {
      onChange(disablePercentageLoad(load));
      return;
    }

    onChange(enablePercentageLoad(load));
  }

  return (
    <div className="flex w-full items-center gap-1.5 max-md:gap-2">
      <Input
        size="sm"
        value={getLoadTargetValue(load)}
        readOnly={disabled}
        aria-label={`Set ${setNumber} target`}
        className="min-w-0 flex-1"
        onChange={(event) => onChange(updateLoadTargetValue(load, event.target.value))}
      />
      <button
        type="button"
        aria-label="Use percentage load"
        aria-pressed={isPercentage}
        disabled={disabled}
        className={`shrink-0 rounded-control border px-2 py-1 text-xs font-medium transition ${
          isPercentage
            ? "border-accent/40 bg-accent/15 text-accent"
            : "border-glass-border bg-glass text-surface-muted hover:text-surface-foreground"
        } disabled:cursor-not-allowed disabled:opacity-60`}
        onClick={handleTogglePercentage}
      >
        %
      </button>
      <LoadUnitControl
        unit={displayUnit}
        disabled={disabled}
        onChange={(unit) => onChange(updateAbsoluteLoadUnit(load, unit))}
      />
    </div>
  );
}
