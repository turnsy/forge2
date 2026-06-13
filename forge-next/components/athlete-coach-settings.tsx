"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Message } from "@/components/ui";
import { unlinkCoachAthleteAction } from "@/lib/links/actions";
import type { AthleteCoachLink } from "@/lib/links/types";

export function AthleteCoachSettings({ link }: { link: AthleteCoachLink }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card role="athlete" className="space-y-4 p-5">
      <div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Your coach</p>
        <p className="mt-1 text-lg font-semibold">{link.coachName}</p>
      </div>
      {error ? <Message tone="error">{error}</Message> : null}
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
    </Card>
  );
}
