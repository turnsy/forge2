"use client";

import { useState } from "react";
import { PlusIcon } from "@/components/icons/plus-icon";
import { InviteCodeModal } from "@/components/invite-code-modal";
import { PendingInvitesPill } from "@/components/pending-invites-pill";
import { Button, PageHeader } from "@/components/ui";

export function AthletesPageHeader({
  inviteCode,
  pendingCount,
}: {
  inviteCode: string;
  pendingCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Athletes"
        actions={
          <div className="flex items-center gap-2">
            <PendingInvitesPill count={pendingCount} />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              fullWidth={false}
              icon={<PlusIcon />}
              onClick={() => setOpen(true)}
            >
              Add
            </Button>
          </div>
        }
      />
      <InviteCodeModal
        inviteCode={inviteCode}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
