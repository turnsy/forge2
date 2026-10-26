"use client";

import { useId, useState } from "react";
import type { InputRequest, InputResponse } from "eve/client";
import { Button } from "@/components/ui";
import { CheckmarkIcon } from "@/components/icons/checkmark-icon";
import { XIcon } from "@/components/icons/x-icon";
import { CANCEL_INPUT_REQUEST_TEXT, inputRequestPresentation } from "@/lib/chat/input-request-presentation";
import { getConfirmationProposal } from "@/lib/chat/confirmed-actions";
import type { ChatMessage } from "@/lib/chat/types";

export function ChatInputRequest({ request, disabled, onRespond, status = "pending", savedChoiceId }: {
  request: InputRequest;
  disabled: boolean;
  onRespond: (response: InputResponse) => Promise<void>;
  status?: NonNullable<ChatMessage["inputCard"]>["status"];
  savedChoiceId?: string;
}) {
  const proposal = getConfirmationProposal(request);
  const confirmation = request.display === "confirmation";
  const options = proposal?.choices ?? (confirmation ? [] : request.options ?? []);
  const [text, setText] = useState("");
  const fieldId = useId();
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(savedChoiceId ?? (proposal?.choices.length === 1 ? proposal.choices[0].id : null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settled = ["completed", "cancelled", "failed"].includes(status);
  const busy = disabled || submitting || settled || status === "submitted";
  const selected = savedChoiceId ?? selectedOptionId;
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
    <section className={`space-y-3${settled ? " opacity-75" : ""}`} aria-label={settled ? "Action summary" : request.display === "confirmation" ? "Approval needed" : "Response needed"}>
      <p className="whitespace-pre-wrap">{prompt}</p>
      {options.length > 0 ? (
        <div role="radiogroup" aria-label={prompt} className="space-y-2">
          {options.map((option, index) => (
            <label key={option.id} className={`flex ${busy ? "cursor-default" : "cursor-pointer"} items-start gap-3 rounded-md border p-3 transition-colors focus-within:ring-2 focus-within:ring-white/20 ${selected === option.id ? "border-glass-primary-border bg-glass-focus" : "border-glass-border"}`}>
              <input type="radio" className="accent-white" name={request.requestId} value={option.id} aria-label={option.label} aria-describedby={option.description ? `${fieldId}-${index}` : undefined} checked={selected === option.id} disabled={busy} onChange={() => setSelectedOptionId(option.id)} />
              <span><span className="block">{option.label}</span>{option.description ? <span id={`${fieldId}-${index}`} className="block text-sm text-surface-muted">{option.description}</span> : null}</span>
            </label>
          ))}
        </div>
      ) : null}
      {confirmation || options.length > 0 ? (
        <div className="flex items-center gap-2">
          <Button type="button" fullWidth={false} size="sm" icon={<CheckmarkIcon />} disabled={busy || (options.length > 0 && !selected)}
            onClick={() => void respond(confirmation ? {
              requestId: request.requestId, optionId: "approve",
              ...(proposal ? { text: JSON.stringify({ confirmationId: proposal.confirmationId, toolName: request.action.toolName, choiceId: selected }) } : {}),
            } : { requestId: request.requestId, optionId: selected! })}>
            {confirmation && !proposal ? confirmLabel : "Confirm"}
          </Button>
          <Button type="button" fullWidth={false} size="sm" variant="secondary" icon={<XIcon />} disabled={busy}
            onClick={() => void respond(confirmation ? {
              requestId: request.requestId, optionId: "deny",
              ...(proposal && selected ? { text: JSON.stringify({ confirmationId: proposal.confirmationId, toolName: request.action.toolName, choiceId: selected }) } : {}),
            } : { requestId: request.requestId, text: CANCEL_INPUT_REQUEST_TEXT })}>
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
      {status !== "pending" ? <p role="status" className="text-sm text-surface-muted">{
        status === "completed" ? "Completed" : status === "cancelled" ? "Cancelled" : status === "failed" ? "Couldn't complete this action" : "Confirmed · working…"
      }</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
