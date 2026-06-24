import type { AbsoluteLoad, SetTarget, PercentageLoad } from "@/lib/plans/workout-plan";

export function isPercentageTarget(load: SetTarget): boolean {
  return load.type === "percentage";
}

export function getTargetValue(load: SetTarget): string {
  return String(load.value);
}

export function getTargetUnit(load: SetTarget, fallback = "lb"): string {
  return load.unit || fallback;
}

export function parseTargetNumber(value: string): number | undefined {
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

export function updateTargetValue(load: SetTarget, rawValue: string): SetTarget {
  const parsed = parseTargetNumber(rawValue);

  return {
    ...load,
    value: parsed ?? load.value,
  };
}

export function updateTargetUnit(load: SetTarget, unit: string): SetTarget {
  return {
    ...load,
    unit: unit.trim(),
  };
}

export function enablePercentageTarget(load: SetTarget): PercentageLoad {
  if (load.type === "percentage") {
    return load;
  }

  const seed = load.value > 0 ? Math.min(load.value, 100) : 75;

  return toExactPercentageLoad(seed, load.unit);
}

export function disablePercentageTarget(load: SetTarget): AbsoluteLoad {
  if (load.type === "absolute") {
    return load;
  }

  return {
    type: "absolute",
    value: load.value,
    unit: load.unit || "lb",
  } satisfies AbsoluteLoad;
}
