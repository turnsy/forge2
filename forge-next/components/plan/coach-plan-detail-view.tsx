"use client";

import { useState } from "react";
import { PencilIcon } from "@/components/icons/pencil-icon";
import { PlanVersionHistory } from "@/components/plan/plan-version-history";
import { PlanViewer } from "@/components/plan/plan-viewer";
import { PlanDetailActions } from "@/components/plan-detail-actions";
import { Button, ButtonLink, PageHeader } from "@/components/ui";
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
          <>
            <Button
              type="button"
              variant={showHistory ? "primary" : "secondary"}
              size="sm"
              fullWidth={false}
              onClick={() => setShowHistory((current) => !current)}
            >
              History
            </Button>
            <PlanDetailActions planId={planId} planTitle={plan.name} />
            <ButtonLink
              href={`/coach?planId=${planId}`}
              variant="secondary"
              size="sm"
              className="inline-flex items-center gap-2"
            >
              <PencilIcon />
              Edit
            </ButtonLink>
          </>
        }
      />
      {showHistory ? (
        <PlanVersionHistory versions={versions} />
      ) : (
        <>
          <p className="text-sm text-surface-muted">
            Created {formatDate(createdAt)}
          </p>
          <PlanViewer plan={plan} view="coach" />
        </>
      )}
    </>
  );
}
