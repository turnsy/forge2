"use client";

import { useState } from "react";
import { PencilIcon } from "@/components/icons/pencil-icon";
import { PlanVersionHistory } from "@/components/plan/plan-version-history";
import { PlanViewer } from "@/components/plan/plan-viewer";
import { Button, ButtonLink, PageHeader } from "@/components/ui";
import { formatDate } from "@/lib/format/date";
import { ROUTE_TRANSITION_FORWARD_TYPES } from "@/lib/motion/route-transitions";
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
        back={{ href: "/coach/plans", ariaLabel: "Back to plans" }}
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
            <ButtonLink
              href={`/coach/plans/${planId}/edit`}
              transitionTypes={[...ROUTE_TRANSITION_FORWARD_TYPES]}
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
