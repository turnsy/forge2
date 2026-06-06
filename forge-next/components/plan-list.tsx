import {
  ActionGroup,
  Button,
  EmptyState,
  List,
  ListRow,
  MetaGroup,
  MetaItem,
} from "@/components/ui";
import { formatDate } from "@/lib/format/date";
import type { CoachPlanListItem } from "@/lib/plans/types";

export function PlanListRow({
  plan,
  appearIndex,
}: {
  plan: CoachPlanListItem;
  appearIndex: number;
}) {
  return (
    <ListRow
      href={`/coach/plans/${plan.id}`}
      metaColumns={2}
      appearIndex={appearIndex}
      leading={
        <h2 className="truncate text-base font-semibold text-surface-foreground">
          {plan.title}
        </h2>
      }
      meta={
        <MetaGroup>
          <MetaItem label="Weeks" value={plan.weekCount} />
          <MetaItem label="Created" value={formatDate(plan.createdAt)} />
        </MetaGroup>
      }
      actions={
        <ActionGroup>
          <Button type="button" variant="secondary" size="sm" fullWidth={false}>
            Assign
          </Button>
          <Button type="button" variant="danger" size="sm" fullWidth={false}>
            Delete
          </Button>
        </ActionGroup>
      }
    />
  );
}

export function PlanList({ plans }: { plans: CoachPlanListItem[] }) {
  if (plans.length === 0) {
    return (
      <EmptyState
        title="No plans yet"
        description="Create a workout plan to assign it to your athletes."
      />
    );
  }

  return (
    <List>
      {plans.map((plan, index) => (
        <PlanListRow key={plan.id} plan={plan} appearIndex={index} />
      ))}
    </List>
  );
}
