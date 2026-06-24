"use client";

import { useState } from "react";
import { PlanVersionHistory } from "@/components/plan/plan-version-history";
import { PlanDayNavigator } from "@/components/plan/plan-day-navigator";
import { PlanDetailActions } from "@/components/plan-detail-actions";
import { PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format/date";
import type { CoachPlanVersionListItem } from "@/lib/plans/repository";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export function CoachPlanDetailView({
  planId,
  plan,
  createdAt,
  versions,
}: {
  planId: string;
  plan: WorkoutPlan;
  createdAt: string;
  versions: CoachPlanVersionListItem[];
}) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <PageHeader
        title={plan.name}
        description={plan.description}
        actions={
          <PlanDetailActions
            planId={planId}
            planTitle={plan.name}
            onToggleHistory={() => setShowHistory((current) => !current)}
          />
        }
      />
      {showHistory ? (
        <PlanVersionHistory versions={versions} />
      ) : (
        <>
          <p className="text-sm text-surface-muted">
            Created {formatDate(createdAt)}
          </p>
          <PlanDayNavigator plan={plan} view="coach" readOnly />
        </>
      )}
    </>
  );
}
