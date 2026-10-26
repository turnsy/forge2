"use client";

import { useId, useState } from "react";
import type { InputRequest, InputResponse } from "eve/client";
import { Button } from "@/components/ui";
import { CheckmarkIcon } from "@/components/icons/checkmark-icon";
import { XIcon } from "@/components/icons/x-icon";
import { CANCEL_INPUT_REQUEST_TEXT, inputRequestPresentation } from "@/lib/chat/input-request-presentation";

export function ChatInputRequest({ request, disabled, onRespond }: {
  request: InputRequest;
  disabled: boolean;
  onRespond: (response: InputResponse) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const fieldId = useId();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = disabled || submitting;
  const confirmation = request.display === "confirmation";
  const options = confirmation ? [] : request.options ?? [];
  const { prompt, confirmLabel } = inputRequestPresentation(request);
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
      <p className="whitespace-pre-wrap">{prompt}</p>
      {options.length > 0 ? (
        <div role="radiogroup" aria-label={prompt} className="space-y-2">
          {options.map((option, index) => (
            <label key={option.id} className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${selectedOptionId === option.id ? "border-coach" : "border-glass-border"}`}>
              <input type="radio" name={request.requestId} value={option.id} aria-label={option.label} aria-describedby={option.description ? `${fieldId}-${index}` : undefined} checked={selectedOptionId === option.id} disabled={busy} onChange={() => setSelectedOptionId(option.id)} />
              <span><span className="block">{option.label}</span>{option.description ? <span id={`${fieldId}-${index}`} className="block text-sm text-surface-muted">{option.description}</span> : null}</span>
            </label>
          ))}
        </div>
      ) : null}
      {confirmation || options.length > 0 ? (
        <div className="flex items-center gap-2">
          <Button type="button" fullWidth={false} size="sm" icon={<CheckmarkIcon />} disabled={busy || (!confirmation && !selectedOptionId)}
            onClick={() => void respond({ requestId: request.requestId, optionId: confirmation ? "approve" : selectedOptionId! })}>
            {confirmation ? confirmLabel : "Confirm selection"}
          </Button>
          <Button type="button" fullWidth={false} size="sm" variant="secondary" icon={<XIcon />} disabled={busy}
            onClick={() => void respond(confirmation ? { requestId: request.requestId, optionId: "deny" } : { requestId: request.requestId, text: CANCEL_INPUT_REQUEST_TEXT })}>
            Cancel
          </Button>
        </div>
      ) : (
        <form className="space-y-2" onSubmit={(event) => {
          event.preventDefault();
          if (text.trim()) void respond({ requestId: request.requestId, text: text.trim() });
        }}>
          <textarea aria-label="Your response" value={text} disabled={busy}
            className="w-full rounded-md border border-glass-border bg-transparent p-2"
            onChange={(event) => setText(event.target.value)} />
          <Button type="submit" fullWidth={false} size="sm" disabled={busy || !text.trim()}>Send response</Button>
        </form>
      )}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
