export type WeightUnit = "kg" | "lb";

const LB_TO_KG = 0.45359237;

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
      return 2.5;
    case "lb":
      return 5;
    default:
      return null;
  }
}

export function roundToIncrement(value: number, increment: number): number {
  if (!Number.isFinite(value) || increment <= 0) return value;
  return Math.round(value / increment) * increment;
}
