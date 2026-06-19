import type { AbsoluteLoad, Load, PercentageLoad } from "@/lib/plans/workout-plan";

export const PERCENTAGE_LOAD_OPERATORS = [
  "exact",
  "at-least",
  "at-most",
  "range",
] as const;

export type PercentageLoadOperator = (typeof PERCENTAGE_LOAD_OPERATORS)[number];

export const PRESET_PERCENTAGE_BASIS_KEYS = [
  "back_squat_1rm",
  "snatch_1rm",
  "clean_1rm",
  "clean_and_jerk_1rm",
  "jerk_1rm",
] as const;

export const CUSTOM_PERCENTAGE_BASIS_OPTION = "__custom_basis__";

export const LOAD_KIND_OPTIONS = ["absolute", "percentage"] as const;
export type LoadKind = (typeof LOAD_KIND_OPTIONS)[number];

export function isPresetPercentageBasis(basis: string): boolean {
  return (PRESET_PERCENTAGE_BASIS_KEYS as readonly string[]).includes(basis);
}

export function parsePercentageNumber(value: string): number | undefined {
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

export function createDefaultPercentageLoad(value = 75): PercentageLoad {
  return {
    type: "percentage",
    unit: "%",
    operator: "exact",
    value,
  };
}

export function normalizePercentageLoad(load: PercentageLoad): PercentageLoad {
  const basis = load.basis?.trim() || undefined;

  if (load.operator === "range") {
    return {
      type: "percentage",
      unit: "%",
      operator: "range",
      minValue: load.minValue ?? 0,
      maxValue: load.maxValue ?? load.minValue ?? 0,
      ...(basis ? { basis } : {}),
    };
  }

  return {
    type: "percentage",
    unit: "%",
    operator: load.operator,
    value: load.value ?? load.minValue ?? 0,
    ...(basis ? { basis } : {}),
  };
}

export function updatePercentageOperator(
  load: PercentageLoad,
  operator: PercentageLoadOperator,
): PercentageLoad {
  if (operator === load.operator) {
    return normalizePercentageLoad(load);
  }

  const seed = load.value ?? load.minValue ?? 75;

  if (operator === "range") {
    return normalizePercentageLoad({
      type: "percentage",
      unit: "%",
      operator: "range",
      minValue: seed,
      maxValue: load.maxValue ?? Math.min(seed + 5, 100),
      basis: load.basis,
    });
  }

  return normalizePercentageLoad({
    type: "percentage",
    unit: "%",
    operator,
    value: seed,
    basis: load.basis,
  });
}

export function updatePercentageScalar(
  load: PercentageLoad,
  field: "value" | "minValue" | "maxValue",
  rawValue: string,
): PercentageLoad {
  const parsed = parsePercentageNumber(rawValue);

  if (load.operator === "range") {
    const minValue = field === "minValue" ? (parsed ?? 0) : (load.minValue ?? 0);
    const maxValue = field === "maxValue" ? (parsed ?? 0) : (load.maxValue ?? 0);

    return normalizePercentageLoad({
      ...load,
      operator: "range",
      minValue,
      maxValue,
    });
  }

  return normalizePercentageLoad({
    ...load,
    value: parsed ?? load.value ?? 0,
  });
}

export function updatePercentageBasis(
  load: PercentageLoad,
  basis: string,
): PercentageLoad {
  const trimmed = basis.trim();
  return normalizePercentageLoad({
    ...load,
    basis: trimmed || undefined,
  });
}

export function switchLoadKind(load: Load, kind: LoadKind): Load {
  if (load.type === kind) {
    return load;
  }

  if (kind === "percentage") {
    const seed =
      load.type === "absolute" && load.value > 0 ? Math.min(load.value, 100) : 75;

    return createDefaultPercentageLoad(seed);
  }

  const seed =
    load.type === "percentage"
      ? load.operator === "range"
        ? (load.minValue ?? 0)
        : (load.value ?? 0)
      : 0;

  return {
    type: "absolute",
    value: seed,
    unit: "lb",
  } satisfies AbsoluteLoad;
}

export function updateAbsoluteLoadValue(load: AbsoluteLoad, rawValue: string): AbsoluteLoad {
  const parsed = parsePercentageNumber(rawValue);

  return {
    ...load,
    value: parsed ?? load.value,
  };
}

export function updateAbsoluteLoadUnit(load: AbsoluteLoad, unit: string): AbsoluteLoad {
  return {
    ...load,
    unit: unit.trim(),
  };
}
