"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardFooter, CardHeader, Message } from "@/components/ui";
import { unlinkCoachAthleteAction } from "@/lib/links/actions";
import type { AthleteCoachLink } from "@/lib/links/types";

export function AthleteCoachSettings({ link }: { link: AthleteCoachLink }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card role="athlete">
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
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await unlinkCoachAthleteAction(link.relationshipId);
              if (!result.ok) {
                setError(result.error ?? "Something went wrong.");
                return;
              }
              router.push("/athlete");
              router.refresh();
            });
          }}
        >
          {pending ? "Unlinking…" : "Unlink coach"}
        </Button>
      </CardFooter>
    </Card>
  );
}
