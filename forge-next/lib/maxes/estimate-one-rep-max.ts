import type { RepsValue } from "@/lib/plans/workout-plan";

export function highestRepSegment(reps: RepsValue): number | null {
  const values = String(reps)
    .split("+")
    .map((part) => Number(part.trim()))
    .filter((part) => Number.isFinite(part) && part > 0);
  return values.length ? Math.max(...values) : null;
}

/** Epley estimate. Combined reps use the highest segment (3+1 => 3). */
export function estimateOneRepMax(weight: number, reps: RepsValue): number | null {
  const highest = highestRepSegment(reps);
  if (!Number.isFinite(weight) || weight <= 0 || highest === null) return null;
  return weight * (1 + highest / 30);
}
