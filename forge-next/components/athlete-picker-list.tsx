import { Checkbox } from "@/components/ui";
import type { CoachAthleteListItem } from "@/lib/athletes/types";

export function AthletePickerList({
  athletes,
  selectedIds,
  onToggle,
}: {
  athletes: CoachAthleteListItem[];
  selectedIds: ReadonlySet<string>;
  onToggle: (athlete: CoachAthleteListItem) => void;
}) {
  if (athletes.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-glass-border">
      {athletes.map((athlete) => (
        <li key={athlete.id}>
          <label className="flex cursor-pointer items-center gap-3 p-3 transition hover:bg-glass-focus/40">
            <Checkbox
              checked={selectedIds.has(athlete.id)}
              onChange={() => onToggle(athlete)}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-surface-foreground">
                {athlete.name}
              </span>
              {athlete.email ? (
                <span className="block truncate text-xs text-surface-muted">
                  {athlete.email}
                </span>
              ) : null}
              <span className="mt-1 block text-xs text-surface-muted">
                Current plan: {athlete.currentPlanName ?? "No plan"}
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
