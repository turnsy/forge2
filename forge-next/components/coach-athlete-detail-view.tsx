"use client";

import { useState } from "react";
import { CoachAthleteDetailActions } from "@/components/coach-athlete-detail-actions";
import { CoachAthletePlanActions } from "@/components/coach-athlete-plan-actions";
import { CompletionProgressRing } from "@/components/completion-progress-ring";
import { PlanViewer } from "@/components/plan/plan-viewer";
import { PlanViewerMeta } from "@/components/plan/plan-viewer-meta";
import {
  EmptyState,
  List,
  ListRow,
  MetaGroup,
  MetaItem,
  PageHeader,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@/components/ui";
import { formatDate } from "@/lib/format/date";
import { computePlanCompletionPercent } from "@/lib/athlete/plan/domain";
import type { AssignedPlan } from "@/lib/athlete/plan/repository";
import type { CoachAthleteRelationship } from "@/lib/links/types";

function formatAssignmentDateRange(plan: AssignedPlan): string {
  const start = formatDate(plan.assignedAt);
  if (plan.completedAt) {
    return `${start} – ${formatDate(plan.completedAt)}`;
  }
  return start;
}

function AssignmentStatusBadge({ status }: { status: AssignedPlan["status"] }) {
  if (status === "completed") {
    return (
      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        Completed
      </span>
    );
  }

  return (
    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-200">
      Aborted
    </span>
  );
}

function CoachAssignedPlanPanel({ assignedPlan }: { assignedPlan: AssignedPlan }) {
  const { plan } = assignedPlan;
  const completionPercent = computePlanCompletionPercent(plan);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <h2 className="min-w-0 text-lg font-semibold text-surface-foreground">
            {plan.name}
          </h2>
          <CompletionProgressRing percent={completionPercent} size={40} />
        </div>
        <PlanViewerMeta plan={plan} layout="row" showDiscipline={false} />
      </div>
      <PlanViewer plan={plan} view="coach" showMeta={false} />
    </div>
  );
}

function PreviousPlansTab({
  previousPlans,
}: {
  previousPlans: AssignedPlan[];
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const selectedPlan =
    previousPlans.find((plan) => plan.id === selectedPlanId) ?? null;

  if (previousPlans.length === 0) {
    return (
      <EmptyState
        title="No previous plans"
        description="Completed and unassigned plans will appear here."
      />
    );
  }

  if (selectedPlan) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedPlanId(null)}
          className="text-sm font-medium text-surface-muted transition hover:text-surface-foreground"
        >
          ← Back to previous plans
        </button>
        <CoachAssignedPlanPanel assignedPlan={selectedPlan} />
      </div>
    );
  }

  return (
    <List>
      {previousPlans.map((plan, index) => (
        <ListRow
          key={plan.id}
          appearIndex={index}
          leading={
            <button
              type="button"
              onClick={() => setSelectedPlanId(plan.id)}
              className="text-left"
            >
              <h2 className="text-base font-semibold text-surface-foreground">
                {plan.plan.name}
              </h2>
            </button>
          }
          meta={
            <MetaGroup>
              <MetaItem
                label="Assigned"
                value={formatAssignmentDateRange(plan)}
              />
            </MetaGroup>
          }
          actions={<AssignmentStatusBadge status={plan.status} />}
        />
      ))}
    </List>
  );
}

export function CoachAthleteDetailView({
  relationship,
  activePlan,
  previousPlans,
}: {
  relationship: CoachAthleteRelationship;
  activePlan: AssignedPlan | null;
  previousPlans: AssignedPlan[];
}) {
  return (
    <>
      <PageHeader title={relationship.athleteName} />
      <Tabs defaultTab="current-plan">
        <TabList>
          <Tab id="current-plan">Current Plan</Tab>
          <Tab id="previous-plans">Previous Plans</Tab>
          <Tab id="info">Info / Unlink</Tab>
        </TabList>

        <TabPanel id="current-plan">
          {!activePlan ? (
            <EmptyState
              title="No plan assigned"
              description="Assign a plan to start tracking this athlete's progress."
              action={<CoachAthletePlanActions relationship={relationship} />}
            />
          ) : (
            <CoachAssignedPlanPanel assignedPlan={activePlan} />
          )}
        </TabPanel>

        <TabPanel id="previous-plans">
          <PreviousPlansTab previousPlans={previousPlans} />
        </TabPanel>

        <TabPanel id="info">
          <div className="space-y-6">
            <MetaGroup>
              <MetaItem label="Name" value={relationship.athleteName} />
              {relationship.athleteEmail ? (
                <MetaItem label="Email" value={relationship.athleteEmail} />
              ) : null}
              {relationship.linkedAt ? (
                <MetaItem label="Joined" value={formatDate(relationship.linkedAt)} />
              ) : null}
            </MetaGroup>
            <CoachAthleteDetailActions relationship={relationship} />
          </div>
        </TabPanel>
      </Tabs>
    </>
  );
}
