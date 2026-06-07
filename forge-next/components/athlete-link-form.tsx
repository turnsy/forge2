"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input, Message, SubmitButton } from "@/components/ui";
import { requestCoachLinkAction } from "@/lib/links/actions";

export function AthleteLinkForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(requestCoachLinkAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Enter your coach&apos;s invite code to request a link.
      </p>
      {state && !state.ok ? <Message tone="error">{state.error}</Message> : null}
      <form action={formAction} className="flex w-full flex-col gap-3">
        <Input
          aria-label="Invite code"
          name="inviteCode"
          placeholder="Invite code"
          autoComplete="off"
          required
        />
        <SubmitButton pendingLabel="Submitting…">Link to coach</SubmitButton>
      </form>
    </div>
  );
}
