"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlanEditorConfirmModal } from "@/components/plan/plan-editor-confirm-modal";
import { Button, Card, CardFooter, CardHeader, Message } from "@/components/ui";
import { unlinkCoachAthleteAction } from "@/lib/links/actions";
import type { AthleteCoachLink } from "@/lib/links/types";

export function AthleteCoachSettings({ link }: { link: AthleteCoachLink }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUnlink() {
    setError(null);
    startTransition(async () => {
      const result = await unlinkCoachAthleteAction(link.relationshipId);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
        setConfirmOpen(false);
        return;
      }
      router.push("/athlete");
      router.refresh();
    });
  }

  return (
    <>
      <Card>
        <CardHeader className="space-y-1 text-left">
          <p className="text-sm text-surface-muted">Your coach</p>
          <h2 className="text-lg font-semibold text-surface-foreground">
            {link.coachName}
          </h2>
        </CardHeader>
        {error ? <Message tone="error">{error}</Message> : null}
        <CardFooter>
          <Button
            type="button"
            variant="danger"
            disabled={pending}
            onClick={() => {
              setError(null);
              setConfirmOpen(true);
            }}
          >
            Unlink coach
          </Button>
        </CardFooter>
      </Card>

      <PlanEditorConfirmModal
        open={confirmOpen}
        title="Unlink coach?"
        description={`You will no longer be linked to ${link.coachName}. Your coach will lose access to your active plan and progress.`}
        confirmLabel={pending ? "Unlinking…" : "Unlink coach"}
        pending={pending}
        onConfirm={handleUnlink}
        onCancel={() => {
          if (!pending) {
            setConfirmOpen(false);
          }
        }}
      />
    </>
  );
}
