"use client";

import { useState } from "react";
import type { InputRequest, InputResponse } from "eve/client";
import { Button } from "@/components/ui";

export function ChatInputRequest({ request, disabled, onRespond }: {
  request: InputRequest;
  disabled: boolean;
  onRespond: (response: InputResponse) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = disabled || submitting;
  async function respond(response: InputResponse) {
    if (busy) return;
    setSubmitting(true);
    setError(null);
    try {
      await onRespond(response);
    } catch {
      setError("Couldn't send your response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <section className="space-y-3" aria-label={request.display === "confirmation" ? "Approval needed" : "Response needed"}>
      <p className="whitespace-pre-wrap">{request.prompt}</p>
      <div className="flex flex-wrap gap-2">
        {request.options?.map((option) => (
          <Button key={option.id} type="button" fullWidth={false} size="sm"
            variant={option.id === "deny" ? "secondary" : "primary"}
            disabled={busy} onClick={() => void respond({ requestId: request.requestId, optionId: option.id })}>
            {option.label}
          </Button>
        ))}
      </div>
      {request.allowFreeform || request.display === "text" || (request.display !== "confirmation" && !request.options?.length) ? (
        <form className="space-y-2" onSubmit={(event) => {
          event.preventDefault();
          if (text.trim()) void respond({ requestId: request.requestId, text: text.trim() });
        }}>
          <textarea aria-label="Your response" value={text} disabled={busy}
            className="w-full rounded-md border border-glass-border bg-transparent p-2"
            onChange={(event) => setText(event.target.value)} />
          <Button type="submit" fullWidth={false} size="sm" disabled={busy || !text.trim()}>Send response</Button>
        </form>
      ) : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
