import type { RepsValue } from "@/lib/plans/workout-plan";

export function parseRepsInput(value: string): number | string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && String(numeric) === trimmed) {
    return numeric;
  }

  return trimmed;
}

export function parseRepsValue(value: string): RepsValue {
  const parsed = parseRepsInput(value);
  if (parsed === null) {
    return "";
  }

  return parsed;
}
