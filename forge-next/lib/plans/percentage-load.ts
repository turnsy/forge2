import type { AbsoluteLoad, Load, PercentageLoad } from "@/lib/plans/workout-plan";

export function isPercentageLoad(load: Load): boolean {
  return load.type === "percentage";
}

export function getLoadTargetValue(load: Load): string {
  return String(load.value);
}

export function getLoadUnit(load: Load, fallback = "lb"): string {
  return load.unit || fallback;
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
  unit: string,
): PercentageLoad {
  return {
    type: "percentage",
    value,
    unit: unit.trim() || "lb",
  };
}

export function updateLoadTargetValue(load: Load, rawValue: string): Load {
  const parsed = parseLoadTargetNumber(rawValue);

  return {
    ...load,
    value: parsed ?? load.value,
  };
}

export function updateLoadUnit(load: Load, unit: string): Load {
  return {
    ...load,
    unit: unit.trim(),
  };
}

export function enablePercentageLoad(load: Load): PercentageLoad {
  if (load.type === "percentage") {
    return load;
  }

  const seed = load.value > 0 ? Math.min(load.value, 100) : 75;

  return toExactPercentageLoad(seed, load.unit);
}

export function disablePercentageLoad(load: Load): AbsoluteLoad {
  if (load.type === "absolute") {
    return load;
  }

  return {
    type: "absolute",
    value: load.value,
    unit: load.unit || "lb",
  } satisfies AbsoluteLoad;
}
