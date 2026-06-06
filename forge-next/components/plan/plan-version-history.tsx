import { List, ListRow, MetaGroup, MetaItem } from "@/components/ui";
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
      <List>
        {versions.map((version, index) => (
          <ListRow
            key={version.id}
            appearIndex={index}
            leading={
              <p className="text-sm text-surface-foreground">
                {version.changeSummary?.trim() || "—"}
              </p>
            }
            meta={
              <MetaGroup>
                <MetaItem label="Created" value={formatDate(version.createdAt)} />
              </MetaGroup>
            }
            actions={
              version.isActive ? (
                <span className="rounded-full border border-glass-border bg-glass-focus px-2.5 py-0.5 text-xs font-medium text-surface-foreground">
                  Active
                </span>
              ) : undefined
            }
          />
        ))}
      </List>
    </section>
  );
}
