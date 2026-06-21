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
  getLoadUnit,
  getLoadTargetValue,
  isPercentageLoad,
  parseLoadTargetNumber,
  updateLoadUnit,
  updateLoadTargetValue,
} from "@/lib/plans/percentage-load";
import type { Load } from "@/lib/plans/workout-plan";

const unitControlClass = "w-[4.75rem] shrink-0 self-stretch";
const percentageToggleClass =
  "inline-flex shrink-0 items-center justify-center self-stretch rounded-control border px-2.5 py-2 text-base font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

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
        className="h-full"
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
  const displayUnit = getLoadUnit(load);
  const loadKey = `${load.type}-${load.value}-${load.unit}`;
  const [syncedLoadKey, setSyncedLoadKey] = useState(loadKey);
  const [draft, setDraft] = useState(() => getLoadTargetValue(load));

  if (loadKey !== syncedLoadKey) {
    setSyncedLoadKey(loadKey);
    setDraft(getLoadTargetValue(load));
  }

  function handleTogglePercentage() {
    if (isPercentage) {
      onChange(disablePercentageLoad(load));
      return;
    }

    onChange(enablePercentageLoad(load));
  }

  function handleTargetChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setDraft(next);

    const parsed = parseLoadTargetNumber(next);
    if (parsed !== undefined) {
      onChange(updateLoadTargetValue(load, next));
    }
  }

  function handleTargetBlur() {
    const parsed = parseLoadTargetNumber(draft);
    if (parsed === undefined) {
      setDraft(getLoadTargetValue(load));
    }
  }

  return (
    <div className="flex w-full items-stretch gap-1.5 max-md:gap-2">
      <Input
        size="sm"
        value={draft}
        readOnly={disabled}
        aria-label={`Set ${setNumber} target`}
        className="min-w-0 flex-1 self-stretch"
        onChange={handleTargetChange}
        onBlur={handleTargetBlur}
      />
      <button
        type="button"
        aria-label="Use percentage load"
        aria-pressed={isPercentage}
        disabled={disabled}
        className={`${percentageToggleClass} min-w-[2.75rem] ${
          isPercentage
            ? "border-accent/40 bg-accent/15 text-accent"
            : "border-glass-border bg-glass text-surface-muted hover:text-surface-foreground"
        }`}
        onClick={handleTogglePercentage}
      >
        %
      </button>
      <LoadUnitControl
        unit={displayUnit}
        disabled={disabled}
        onChange={(unit) => onChange(updateLoadUnit(load, unit))}
      />
    </div>
  );
}
