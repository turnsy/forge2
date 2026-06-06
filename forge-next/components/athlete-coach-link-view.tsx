"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Message } from "@/components/ui";
import {
  cancelCoachLinkRequestAction,
  unlinkCoachAthleteAction,
} from "@/lib/links/actions";
import type { AthleteCoachLink } from "@/lib/links/types";

export function AthleteCoachLinkView({ link }: { link: AthleteCoachLink }) {
  const router = useRouter();
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

  if (link.status === "pending") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-lg font-medium">Waiting for {link.coachName} to accept</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Your link request is pending.
        </p>
        {error ? <Message tone="error">{error}</Message> : null}
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            runAction(() => cancelCoachLinkRequestAction(link.relationshipId))
          }
        >
          {pending ? "Canceling…" : "Cancel request"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Your coach</p>
      <p className="text-2xl font-semibold">{link.coachName}</p>
      {error ? <Message tone="error">{error}</Message> : null}
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => runAction(() => unlinkCoachAthleteAction(link.relationshipId))}
      >
        {pending ? "Unlinking…" : "Unlink coach"}
      </Button>
    </div>
  );
}
