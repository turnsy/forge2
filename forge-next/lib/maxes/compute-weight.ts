import { convertWeight, incrementForUnit, roundToIncrement } from "./units";

export type MaxValue = { value: number; unit: string };

export function computePrescribedWeight(
  max: MaxValue | null,
  percentage: number,
  targetUnit: string,
): number | null {
  if (!max || !Number.isFinite(percentage)) return null;
  const converted = convertWeight(max.value, max.unit, targetUnit);
  const increment = incrementForUnit(targetUnit);
  if (converted === null || increment === null) return null;
  return roundToIncrement((converted * percentage) / 100, increment);
}
