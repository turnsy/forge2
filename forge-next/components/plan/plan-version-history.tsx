import { formatDate } from "@/lib/format/date";
import type { CoachPlanVersionListItem } from "@/lib/plans/repository";

export function PlanVersionHistory({
  versions,
}: {
  versions: CoachPlanVersionListItem[];
}) {
  if (versions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-surface-foreground">
        Version history
      </h2>
      <ul className="divide-y divide-glass-border rounded-card border border-glass-border bg-glass">
        {versions.map((version) => (
          <li
            key={version.id}
            className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-surface-foreground">
                {version.changeSummary?.trim() || "—"}
              </p>
              <p className="text-surface-muted">{formatDate(version.createdAt)}</p>
            </div>
            {version.isActive ? (
              <span className="shrink-0 rounded-full border border-glass-border bg-glass-focus px-2.5 py-0.5 text-xs font-medium text-surface-foreground">
                Active
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
