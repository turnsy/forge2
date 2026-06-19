"use client";

import { useState } from "react";
import { CompletionProgressRing } from "@/components/completion-progress-ring";
import { PlanDayNavigator } from "@/components/plan/plan-day-navigator";
import { PlanViewerMeta } from "@/components/plan/plan-viewer-meta";
import {
  EmptyState,
  List,
  ListRow,
  MetaGroup,
  MetaItem,
  PageBackButton,
} from "@/components/ui";
import { computePlanCompletionPercent } from "@/lib/athlete/plan/domain";
import { getAssignedPlanHistoryMeta } from "@/lib/athlete/plan/display";
import type { AssignedPlan } from "@/lib/athlete/plan/repository";

function AssignmentStatusBadge({ status }: { status: AssignedPlan["status"] }) {
  const baseClass =
    "inline-flex min-w-[5.75rem] justify-center rounded-full px-2.5 py-0.5 text-center text-xs font-medium";

  if (status === "completed") {
    return (
      <span
        className={`${baseClass} border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300`}
      >
        Completed
      </span>
    );
  }

  return (
    <span
      className={`${baseClass} border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200`}
    >
      Aborted
    </span>
  );
}

function AthleteAssignedPlanPanel({
  assignedPlan,
  onBack,
}: {
  assignedPlan: AssignedPlan;
  onBack?: () => void;
}) {
  const { plan } = assignedPlan;
  const completionPercent = computePlanCompletionPercent(plan);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {onBack ? (
              <PageBackButton ariaLabel="Back to history" onClick={onBack} />
            ) : null}
            <h2 className="min-w-0 text-lg font-semibold text-surface-foreground">
              {plan.name}
            </h2>
          </div>
          <CompletionProgressRing percent={completionPercent} size={40} />
        </div>
        <PlanViewerMeta plan={plan} layout="row" showDiscipline={false} />
      </div>
      <PlanDayNavigator
        plan={plan}
        view="athlete"
        readOnly
        assignmentId={assignedPlan.id}
      />
    </div>
  );
}

export function AthletePlanHistoryView({
  plans,
}: {
  plans: AssignedPlan[];
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  if (plans.length === 0) {
    return (
      <EmptyState
        title="No previous plans"
        description="Completed and unassigned plans will appear here."
      />
    );
  }

  if (selectedPlan) {
    return (
      <AthleteAssignedPlanPanel
        assignedPlan={selectedPlan}
        onBack={() => setSelectedPlanId(null)}
      />
    );
  }

  return (
    <List>
      {plans.map((plan, index) => {
        const historyMeta = getAssignedPlanHistoryMeta(plan);

        return (
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
                <MetaItem label={historyMeta.label} value={historyMeta.value} />
              </MetaGroup>
            }
            actions={<AssignmentStatusBadge status={plan.status} />}
          />
        );
      })}
    </List>
  );
}
