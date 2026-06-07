"use client";

import { useState } from "react";
import { PlanAssignAthletesModal } from "@/components/plan-assign-athletes-modal";
import { PlanDeleteModal } from "@/components/plan-delete-modal";
import { ActionGroup, Button } from "@/components/ui";
import type { CoachPlanListItem } from "@/lib/plans/types";

export function PlanListRowActions({ plan }: { plan: CoachPlanListItem }) {
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <ActionGroup>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth={false}
          onClick={() => setAssignOpen(true)}
        >
          Assign
        </Button>
        <Button
          type="button"
          variant="danger"
          size="sm"
          fullWidth={false}
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </Button>
      </ActionGroup>

      {assignOpen ? (
        <PlanAssignAthletesModal
          planId={plan.id}
          planTitle={plan.title}
          onClose={() => setAssignOpen(false)}
        />
      ) : null}

      {deleteOpen ? (
        <PlanDeleteModal
          planId={plan.id}
          planTitle={plan.title}
          onClose={() => setDeleteOpen(false)}
        />
      ) : null}
    </>
  );
}
