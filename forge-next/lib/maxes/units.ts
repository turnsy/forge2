export type WeightUnit = "kg" | "lb";

export const WEIGHT_UNITS: WeightUnit[] = ["kg", "lb"];

const LB_TO_KG = 0.45359237;

export function isValidWeightUnit(unit: string): unit is WeightUnit {
  const normalized = unit.trim().toLowerCase();
  return normalized === "kg" || normalized === "lb";
}

export function normalizeWeightUnit(unit: string): WeightUnit | null {
  const normalized = unit.trim().toLowerCase();
  if (normalized === "kg" || normalized === "lb") {
    return normalized;
  }
  return null;
}

export function convertWeight(value: number, from: string, to: string): number | null {
  const source = from.trim().toLowerCase();
  const target = to.trim().toLowerCase();
  if (source === target) return value;
  if (source === "lb" && target === "kg") return value * LB_TO_KG;
  if (source === "kg" && target === "lb") return value / LB_TO_KG;
  return null;
}

export function incrementForUnit(unit: string): number | null {
  switch (unit.trim().toLowerCase()) {
    case "kg":
    case "lb":
      return 0.5;
    default:
      return null;
  }
}

export function roundToIncrement(value: number, increment: number): number {
  if (!Number.isFinite(value) || increment <= 0) return value;
  return Math.round(value / increment) * increment;
}
