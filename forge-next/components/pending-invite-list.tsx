"use client";

import { AthleteMetadataEditor } from "@/components/metadata/athlete-metadata-editor";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ActionGroup,
  Button,
  EmptyState,
  List,
  ListRow,
  Message,
  MetaGroup,
  MetaItem,
} from "@/components/ui";
import {
  acceptCoachLinkAction,
  rejectCoachLinkAction,
} from "@/lib/links/actions";
import { formatDate } from "@/lib/format/date";
import type { PendingInvite } from "@/lib/links/types";

function PendingInviteRow({
  invite,
  appearIndex,
}: {
  invite: PendingInvite;
  appearIndex: number;
}) {
  const router = useRouter();
  const [reviewProfile, setReviewProfile] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <ListRow
      appearIndex={appearIndex}
      leading={
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-base font-semibold text-surface-foreground">
            {invite.athleteName}
          </h2>
          {invite.athleteEmail ? (
            <p className="truncate text-sm text-surface-muted">
              {invite.athleteEmail}
            </p>
          ) : null}
          <details onToggle={(e) => setReviewProfile(e.currentTarget.open)}>
            <summary className="cursor-pointer text-sm">
              Review profile / fill missing fields (or accept and complete
              later)
            </summary>
            {reviewProfile ? (
              <AthleteMetadataEditor athleteId={invite.athleteId} />
            ) : null}
          </details>
          {error ? <Message tone="error">{error}</Message> : null}
        </div>
      }
      meta={
        <MetaGroup>
          <MetaItem label="Requested" value={formatDate(invite.requestedAt)} />
        </MetaGroup>
      }
      actions={
        <ActionGroup>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() =>
              runAction(() => acceptCoachLinkAction(invite.relationshipId))
            }
          >
            Accept
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={pending}
            onClick={() =>
              runAction(() => rejectCoachLinkAction(invite.relationshipId))
            }
          >
            Reject
          </Button>
        </ActionGroup>
      }
    />
  );
}

export function PendingInviteList({ invites }: { invites: PendingInvite[] }) {
  if (invites.length === 0) {
    return (
      <EmptyState
        title="No pending invites"
        description="Athlete link requests will appear here."
      />
    );
  }

  return (
    <List>
      {invites.map((invite, index) => (
        <PendingInviteRow
          key={invite.relationshipId}
          invite={invite}
          appearIndex={index}
        />
      ))}
    </List>
  );
}
