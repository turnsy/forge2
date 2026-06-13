import { AthleteListRowActions } from "@/components/athlete-list-row-actions";
import { CompletionProgressRing } from "@/components/completion-progress-ring";
import { EmptyState, List, ListRow, MetaGroup, MetaItem } from "@/components/ui";
import { formatDate } from "@/lib/format/date";
import type { CoachAthleteListItem } from "@/lib/athletes/types";

function shouldShowCompletionBadge(athlete: CoachAthleteListItem): boolean {
  return (
    athlete.currentPlanName !== null && athlete.completionPercent !== null
  );
}

export function AthleteListRow({
  athlete,
  appearIndex,
}: {
  athlete: CoachAthleteListItem;
  appearIndex: number;
}) {
  const showCompletionBadge = shouldShowCompletionBadge(athlete);
  const currentPlanValue = athlete.currentPlanName ?? "No plan";
  const metaClassName = showCompletionBadge
    ? "md:w-auto md:min-w-[28rem] md:max-w-xl md:grid-cols-[auto_minmax(0,1.75fr)_auto]"
    : "md:w-auto md:min-w-[24rem] md:max-w-md md:grid-cols-[minmax(0,1.75fr)_auto]";

  return (
    <ListRow
      href={`/coach/athletes/${athlete.id}`}
      appearIndex={appearIndex}
      metaClassName={metaClassName}
      leading={
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="truncate text-base font-semibold text-surface-foreground">
                {athlete.name}
              </h2>
              {athlete.email ? (
                <p className="truncate text-sm text-surface-muted">{athlete.email}</p>
              ) : null}
            </div>
            {showCompletionBadge ? (
              <CompletionProgressRing
                percent={athlete.completionPercent!}
                className="md:hidden"
              />
            ) : null}
          </div>
        </div>
      }
      meta={
        <MetaGroup>
          {showCompletionBadge ? (
            <div className="hidden md:contents">
              <CompletionProgressRing
                percent={athlete.completionPercent!}
                className="mt-0.5"
              />
            </div>
          ) : null}
          <MetaItem
            label="Current plan"
            value={<span className="block md:truncate">{currentPlanValue}</span>}
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
