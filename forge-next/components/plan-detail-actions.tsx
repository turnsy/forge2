"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlanAssignAthletesModal } from "@/components/plan-assign-athletes-modal";
import { PlanDeleteModal } from "@/components/plan-delete-modal";
import { Button } from "@/components/ui";

export function PlanDetailActions({
  planId,
  planTitle,
}: {
  planId: string;
  planTitle: string;
}) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
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

      {assignOpen ? (
        <PlanAssignAthletesModal
          planId={planId}
          planTitle={planTitle}
          onClose={() => setAssignOpen(false)}
        />
      ) : null}

      {deleteOpen ? (
        <PlanDeleteModal
          planId={planId}
          planTitle={planTitle}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => router.push("/coach/plans")}
        />
      ) : null}
    </>
  );
}
