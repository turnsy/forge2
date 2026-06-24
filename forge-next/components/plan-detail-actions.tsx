"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EllipsisIcon } from "@/components/icons/ellipsis-icon";
import { PlanAssignAthletesModal } from "@/components/plan-assign-athletes-modal";
import { PlanDeleteModal } from "@/components/plan-delete-modal";
import { IconButton } from "@/components/ui";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";

export function PlanDetailActions({
  planId,
  planTitle,
  onToggleHistory,
}: {
  planId: string;
  planTitle: string;
  onToggleHistory: () => void;
}) {
  const router = useRouter();
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Dropdown
        menuLabel="Plan actions"
        align="end"
        side="bottom"
        trigger={({ toggle, menuId, open }) => (
          <IconButton
            variant="plain"
            size="sm"
            icon={<EllipsisIcon />}
            aria-label="Plan actions"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={(event) => {
              event.stopPropagation();
              toggle();
            }}
          />
        )}
      >
        <DropdownItem onSelect={() => router.push(`/coach?planId=${planId}`)}>
          Edit
        </DropdownItem>
        <DropdownItem onSelect={() => setAssignOpen(true)}>Assign</DropdownItem>
        <DropdownItem onSelect={onToggleHistory}>History</DropdownItem>
        <DropdownItem destructive onSelect={() => setDeleteOpen(true)}>
          Delete
        </DropdownItem>
      </Dropdown>

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
