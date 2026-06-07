import { AthleteListRowActions } from "@/components/athlete-list-row-actions";
import { EmptyState, List, ListRow, MetaGroup, MetaItem } from "@/components/ui";
import { formatDate } from "@/lib/format/date";
import type { CoachAthleteListItem } from "@/lib/athletes/types";

export function AthleteListRow({
  athlete,
  appearIndex,
}: {
  athlete: CoachAthleteListItem;
  appearIndex: number;
}) {
  return (
    <ListRow
      href={`/coach/athletes/${athlete.id}`}
      appearIndex={appearIndex}
      leading={
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-base font-semibold text-surface-foreground">
            {athlete.name}
          </h2>
          {athlete.email ? (
            <p className="truncate text-sm text-surface-muted">{athlete.email}</p>
          ) : null}
        </div>
      }
      meta={
        <MetaGroup>
          <MetaItem
            label="Current plan"
            value={athlete.currentPlanName ?? "No plan"}
          />
          <MetaItem label="Joined" value={formatDate(athlete.joinedAt)} />
        </MetaGroup>
      }
      actions={<AthleteListRowActions athlete={athlete} />}
    />
  );
}

export function AthleteList({ athletes }: { athletes: CoachAthleteListItem[] }) {
  if (athletes.length === 0) {
    return (
      <EmptyState
        title="No athletes yet"
        description="Athletes can link to you using your invite code."
      />
    );
  }

  return (
    <List>
      {athletes.map((athlete, index) => (
        <AthleteListRow key={athlete.id} athlete={athlete} appearIndex={index} />
      ))}
    </List>
  );
}
