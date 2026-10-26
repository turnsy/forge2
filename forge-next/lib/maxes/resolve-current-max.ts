import { normalizeWeightUnit } from "./units";

export type AthleteMax = {
  value: number;
  unit: string;
  loggedAt: string | Date;
  source?: string;
  voidedAt?: string | null;
  entryOrder?: number;
};

/** Latest valid training max. Manual entries may lower it; invalidated log entries never apply. */
export function resolveCurrentMax<T extends AthleteMax>(rows: T[]): T | null {
  return rows.reduce<T | null>((latest, row) => {
    const timestamp = new Date(row.loggedAt).getTime();
    if (
      !Number.isFinite(row.value) ||
      row.value <= 0 ||
      !normalizeWeightUnit(row.unit) ||
      !Number.isFinite(timestamp) ||
      row.voidedAt ||
      row.source === "estimated_from_log"
    )
      return latest;
    if (!latest) return row;
    const previousTimestamp = new Date(latest.loggedAt).getTime();
    return timestamp > previousTimestamp ||
      (timestamp === previousTimestamp &&
        (row.entryOrder ?? 0) > (latest.entryOrder ?? 0))
      ? row
      : latest;
  }, null);
}
