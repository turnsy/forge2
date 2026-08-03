import { convertWeight } from "@/lib/maxes/units";

export type AthleteMax = {
  value: number;
  unit: string;
  loggedAt: string | Date;
  source?: string;
};

function maxValueInKg(row: AthleteMax): number | null {
  return convertWeight(row.value, row.unit, "kg");
}

export function resolveCurrentMax(rows: AthleteMax[]): AthleteMax | null {
  const usable = rows.filter((row) => Number.isFinite(row.value) && row.value > 0);
  if (usable.length === 0) {
    return null;
  }

  return usable.reduce<AthleteMax | null>((best, row) => {
    if (!best) {
      return row;
    }

    const bestKg = maxValueInKg(best);
    const rowKg = maxValueInKg(row);

    if (bestKg !== null && rowKg !== null) {
      return rowKg > bestKg ? row : best;
    }

    if (row.unit === best.unit && row.value > best.value) {
      return row;
    }

    return best;
  }, null);
}
