export type AthleteMax = {
  value: number;
  unit: string;
  loggedAt: string | Date;
  source?: string;
};

export function resolveCurrentMax(rows: AthleteMax[]): AthleteMax | null {
  return rows
    .filter((row) => Number.isFinite(row.value) && row.value > 0)
    .sort(
      (a, b) =>
        new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime(),
    )[0] ?? null;
}
