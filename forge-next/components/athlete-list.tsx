import { AthleteListRowActions } from "@/components/athlete-list-row-actions";
import { EmptyState, List, ListRow, MetaGroup, MetaItem, Pill } from "@/components/ui";
import { formatDate } from "@/lib/format/date";
import type { CoachAthleteListItem } from "@/lib/athletes/types";

function CompletionBadge({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  return (
    <Pill className={`shrink-0 px-2 py-0.5 text-xs${className ? ` ${className}` : ""}`}>
      {percent}%
    </Pill>
  );
}

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

  return (
    <ListRow
      href={`/coach/athletes/${athlete.id}`}
      appearIndex={appearIndex}
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
              <CompletionBadge
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
            <>
              <div className="min-w-0 md:hidden">
                <MetaItem label="Current plan" value={currentPlanValue} />
              </div>
              <div className="hidden min-w-0 items-start gap-2 md:flex">
                <CompletionBadge
                  percent={athlete.completionPercent!}
                  className="mt-0.5"
                />
                <MetaItem label="Current plan" value={currentPlanValue} />
              </div>
            </>
          ) : (
            <MetaItem label="Current plan" value={currentPlanValue} />
          )}
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
