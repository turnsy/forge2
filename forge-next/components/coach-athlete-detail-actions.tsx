"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Message } from "@/components/ui";
import { unlinkCoachAthleteAction } from "@/lib/links/actions";
import type { CoachAthleteRelationship } from "@/lib/links/types";

export function CoachAthleteDetailActions({
  relationship,
}: {
  relationship: CoachAthleteRelationship;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (relationship.status !== "active") {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {error ? <Message tone="error">{error}</Message> : null}
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await unlinkCoachAthleteAction(relationship.relationshipId);
            if (!result.ok) {
              setError(result.error ?? "Something went wrong.");
              return;
            }
            router.push("/coach/athletes");
            router.refresh();
          });
        }}
      >
        {pending ? "Unlinking…" : "Unlink athlete"}
      </Button>
    </div>
  );
}
