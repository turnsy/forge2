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

  return fallback;
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

export function toExactPercentageLoad(value: number): PercentageLoad {
  return {
    type: "percentage",
    unit: "%",
    operator: "exact",
    value,
  };
}

export function coerceToExactPercentageLoad(load: PercentageLoad): PercentageLoad {
  const value =
    load.operator === "range"
      ? (load.minValue ?? load.value ?? 0)
      : (load.value ?? load.minValue ?? 0);

  return toExactPercentageLoad(value);
}

export function updateLoadTargetValue(load: Load, rawValue: string): Load {
  const parsed = parseLoadTargetNumber(rawValue);

  if (load.type === "absolute") {
    return {
      ...load,
      value: parsed ?? load.value,
    } satisfies AbsoluteLoad;
  }

  return toExactPercentageLoad(parsed ?? load.value ?? 0);
}

export function updateAbsoluteLoadUnit(
  load: Load,
  unit: string,
  rememberedUnit: string,
): { load: Load; rememberedUnit: string } {
  const trimmed = unit.trim();

  if (load.type === "absolute") {
    return {
      load: {
        ...load,
        unit: trimmed,
      },
      rememberedUnit: trimmed || rememberedUnit,
    };
  }

  return {
    load,
    rememberedUnit: trimmed || rememberedUnit,
  };
}

export function enablePercentageLoad(
  load: Load,
  rememberedUnit: string,
): { load: Load; rememberedUnit: string } {
  if (load.type === "percentage") {
    return {
      load: coerceToExactPercentageLoad(load),
      rememberedUnit,
    };
  }

  const seed =
    load.value > 0 ? Math.min(load.value, 100) : 75;

  return {
    load: toExactPercentageLoad(seed),
    rememberedUnit: load.unit || rememberedUnit,
  };
}

export function disablePercentageLoad(
  load: Load,
  rememberedUnit: string,
): Load {
  if (load.type === "absolute") {
    return load;
  }

  const coerced = coerceToExactPercentageLoad(load);

  return {
    type: "absolute",
    value: coerced.value ?? 0,
    unit: rememberedUnit || "lb",
  } satisfies AbsoluteLoad;
}
