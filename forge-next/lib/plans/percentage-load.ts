import type { AbsoluteLoad, Load, PercentageLoad } from "@/lib/plans/workout-plan";

export function isPercentageLoad(load: Load): boolean {
  return load.type === "percentage";
}

export function getLoadTargetValue(load: Load): string {
  if (load.type === "absolute") {
    return String(load.value);
  }

  if (load.operator === "range") {
    return String(load.minValue ?? load.value ?? "");
  }

  return String(load.value ?? "");
}

export function getAbsoluteUnitForLoad(load: Load, fallback = "lb"): string {
  if (load.type === "absolute") {
    return load.unit;
  }

  return load.absoluteUnit ?? fallback;
}

export function parseLoadTargetNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") {
    return undefined;
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return undefined;
  }

  return numeric;
}

export function toExactPercentageLoad(
  value: number,
  absoluteUnit?: string,
): PercentageLoad {
  const load: PercentageLoad = {
    type: "percentage",
    unit: "%",
    operator: "exact",
    value,
  };

  if (absoluteUnit?.trim()) {
    load.absoluteUnit = absoluteUnit.trim();
  }

  return load;
}

export function coerceToExactPercentageLoad(load: PercentageLoad): PercentageLoad {
  const value =
    load.operator === "range"
      ? (load.minValue ?? load.value ?? 0)
      : (load.value ?? load.minValue ?? 0);

  return {
    ...toExactPercentageLoad(value, load.absoluteUnit),
    absoluteUnit: load.absoluteUnit,
  };
}

export function updateLoadTargetValue(load: Load, rawValue: string): Load {
  const parsed = parseLoadTargetNumber(rawValue);

  if (load.type === "absolute") {
    return {
      ...load,
      value: parsed ?? load.value,
    } satisfies AbsoluteLoad;
  }

  return {
    ...toExactPercentageLoad(parsed ?? load.value ?? 0, load.absoluteUnit),
    absoluteUnit: load.absoluteUnit,
  };
}

export function updateAbsoluteLoadUnit(load: Load, unit: string): Load {
  const trimmed = unit.trim();

  if (load.type === "absolute") {
    return {
      ...load,
      unit: trimmed,
    };
  }

  return {
    ...load,
    absoluteUnit: trimmed || load.absoluteUnit,
  };
}

export function enablePercentageLoad(load: Load): PercentageLoad {
  if (load.type === "percentage") {
    return coerceToExactPercentageLoad(load);
  }

  const seed = load.value > 0 ? Math.min(load.value, 100) : 75;

  return toExactPercentageLoad(seed, load.unit);
}

export function disablePercentageLoad(load: Load): AbsoluteLoad {
  if (load.type === "absolute") {
    return load;
  }

  const coerced = coerceToExactPercentageLoad(load);

  return {
    type: "absolute",
    value: coerced.value ?? 0,
    unit: coerced.absoluteUnit || "lb",
  } satisfies AbsoluteLoad;
}
