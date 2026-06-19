"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Input, Select } from "@/components/ui";
import {
  CUSTOM_LOAD_UNIT_OPTION,
  isPresetLoadUnit,
  PRESET_LOAD_UNITS,
} from "@/lib/plans/load-units";
import {
  CUSTOM_PERCENTAGE_BASIS_OPTION,
  isPresetPercentageBasis,
  PERCENTAGE_LOAD_OPERATORS,
  PRESET_PERCENTAGE_BASIS_KEYS,
  switchLoadKind,
  updateAbsoluteLoadUnit,
  updateAbsoluteLoadValue,
  updatePercentageBasis,
  updatePercentageOperator,
  updatePercentageScalar,
  type LoadKind,
  type PercentageLoadOperator,
} from "@/lib/plans/percentage-load";
import type { Load, PercentageLoad } from "@/lib/plans/workout-plan";

const kindControlClass = "w-[5.5rem] shrink-0";
const operatorControlClass = "w-[5.75rem] shrink-0";
const unitControlClass = "w-[4.75rem] shrink-0";
const basisControlClass = "min-w-0 flex-1";

const OPERATOR_LABELS: Record<PercentageLoadOperator, string> = {
  exact: "Exact",
  "at-least": "At least",
  "at-most": "At most",
  range: "Range",
};

function AbsoluteUnitControl({
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

function PercentageBasisControl({
  basis,
  disabled,
  setNumber,
  onChange,
}: {
  basis: string | undefined;
  disabled: boolean;
  setNumber: number;
  onChange: (basis: string) => void;
}) {
  const currentBasis = basis ?? "";
  const [customActive, setCustomActive] = useState(
    () => currentBasis !== "" && !isPresetPercentageBasis(currentBasis),
  );
  const [customDraft, setCustomDraft] = useState(() =>
    customActive ? currentBasis : "",
  );

  function handleSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (next === CUSTOM_PERCENTAGE_BASIS_OPTION) {
      setCustomDraft(isPresetPercentageBasis(currentBasis) ? "" : currentBasis);
      setCustomActive(true);
      return;
    }

    setCustomActive(false);
    onChange(next);
  }

  if (customActive) {
    return (
      <Input
        size="sm"
        value={customDraft}
        disabled={disabled}
        aria-label={`Set ${setNumber} percentage basis`}
        placeholder="e.g. front_squat_1rm"
        className={basisControlClass}
        onChange={(event) => {
          const next = event.target.value;
          setCustomDraft(next);
          onChange(next);
        }}
        onBlur={() => {
          const trimmed = customDraft.trim();
          if (!trimmed || isPresetPercentageBasis(trimmed)) {
            setCustomActive(false);
            onChange("");
            return;
          }

          onChange(trimmed);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setCustomActive(false);
            onChange("");
          }
        }}
      />
    );
  }

  const selectValue =
    currentBasis === ""
      ? ""
      : isPresetPercentageBasis(currentBasis)
        ? currentBasis
        : CUSTOM_PERCENTAGE_BASIS_OPTION;

  return (
    <Select
      hideLabel
      label="Percentage basis"
      size="sm"
      value={selectValue}
      disabled={disabled}
      className={basisControlClass}
      onChange={handleSelectChange}
    >
      <option value="">No basis</option>
      {PRESET_PERCENTAGE_BASIS_KEYS.map((preset) => (
        <option key={preset} value={preset}>
          {preset}
        </option>
      ))}
      <option value={CUSTOM_PERCENTAGE_BASIS_OPTION}>Custom basis</option>
    </Select>
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
  function handleKindChange(event: ChangeEvent<HTMLSelectElement>) {
    onChange(switchLoadKind(load, event.target.value as LoadKind));
  }

  return (
    <div className="flex min-w-[12rem] flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className={kindControlClass}>
          <Select
            hideLabel
            label="Load type"
            size="sm"
            value={load.type}
            disabled={disabled}
            className="w-full"
            onChange={handleKindChange}
          >
            <option value="absolute">Weight</option>
            <option value="percentage">%</option>
          </Select>
        </div>

        {load.type === "absolute" ? (
          <>
            <Input
              size="sm"
              value={String(load.value)}
              readOnly={disabled}
              aria-label={`Set ${setNumber} target`}
              className="min-w-0 flex-1"
              onChange={(event) =>
                onChange(updateAbsoluteLoadValue(load, event.target.value))
              }
            />
            <AbsoluteUnitControl
              unit={load.unit}
              disabled={disabled}
              onChange={(unit) => onChange(updateAbsoluteLoadUnit(load, unit))}
            />
          </>
        ) : (
          <PercentageValueControls
            load={load}
            disabled={disabled}
            setNumber={setNumber}
            onChange={onChange}
          />
        )}
      </div>

      {load.type === "percentage" ? (
        <PercentageBasisControl
          basis={load.basis}
          disabled={disabled}
          setNumber={setNumber}
          onChange={(basis) => onChange(updatePercentageBasis(load, basis))}
        />
      ) : null}
    </div>
  );
}

function PercentageValueControls({
  load,
  disabled,
  setNumber,
  onChange,
}: {
  load: PercentageLoad;
  disabled: boolean;
  setNumber: number;
  onChange: (load: Load) => void;
}) {
  return (
    <>
      <div className={operatorControlClass}>
        <Select
          hideLabel
          label="Percentage operator"
          size="sm"
          value={load.operator}
          disabled={disabled}
          className="w-full"
          onChange={(event) =>
            onChange(
              updatePercentageOperator(load, event.target.value as PercentageLoadOperator),
            )
          }
        >
          {PERCENTAGE_LOAD_OPERATORS.map((operator) => (
            <option key={operator} value={operator}>
              {OPERATOR_LABELS[operator]}
            </option>
          ))}
        </Select>
      </div>

      {load.operator === "range" ? (
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <Input
            size="sm"
            value={String(load.minValue ?? "")}
            readOnly={disabled}
            aria-label={`Set ${setNumber} minimum percentage`}
            className="min-w-0 flex-1"
            onChange={(event) =>
              onChange(updatePercentageScalar(load, "minValue", event.target.value))
            }
          />
          <span className="shrink-0 text-xs text-surface-muted">–</span>
          <Input
            size="sm"
            value={String(load.maxValue ?? "")}
            readOnly={disabled}
            aria-label={`Set ${setNumber} maximum percentage`}
            className="min-w-0 flex-1"
            onChange={(event) =>
              onChange(updatePercentageScalar(load, "maxValue", event.target.value))
            }
          />
        </div>
      ) : (
        <Input
          size="sm"
          value={String(load.value ?? "")}
          readOnly={disabled}
          aria-label={`Set ${setNumber} target percentage`}
          className="min-w-0 flex-1"
          onChange={(event) =>
            onChange(updatePercentageScalar(load, "value", event.target.value))
          }
        />
      )}

      <span className="shrink-0 text-xs text-surface-muted">%</span>
    </>
  );
}
