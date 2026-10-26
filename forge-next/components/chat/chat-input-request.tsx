"use client";

import { useId, useState } from "react";
import type { InputRequest, InputResponse } from "eve/client";
import { Button } from "@/components/ui";
import { CheckmarkIcon } from "@/components/icons/checkmark-icon";
import { XIcon } from "@/components/icons/x-icon";
import { allowsMultipleSelections, selectionResponse } from "@/lib/chat/input-selection";
import type { ChatMessage } from "@/lib/chat/types";

export function ChatInputRequest({ request, disabled, onRespond, status = "pending", savedChoiceIds }: {
  request: InputRequest;
  disabled: boolean;
  onRespond: (response: InputResponse) => Promise<void>;
  status?: NonNullable<ChatMessage["inputCard"]>["status"];
  savedChoiceIds?: string[];
}) {
  const confirmation = request.display === "confirmation";
  const options = confirmation ? [] : request.options ?? [];
  const multiple = allowsMultipleSelections(request);
  const [text, setText] = useState("");
  const fieldId = useId();
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(savedChoiceIds ?? (options.length === 1 ? [options[0].id] : []));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const settled = ["completed", "cancelled", "failed"].includes(status);
  const busy = disabled || submitting || settled || status === "submitted";
  const selected = savedChoiceIds ?? selectedOptionIds;
  const prompt = request.prompt.startsWith("Approve tool call:") ? "Confirm the proposed action?" : request.prompt;
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
    <section className={`space-y-3${settled ? " opacity-75" : ""}`} aria-label={settled ? "Response summary" : request.display === "confirmation" ? "Approval needed" : "Response needed"}>
      <p className="whitespace-pre-wrap">{prompt}</p>
      {options.length > 0 ? (
        <div role={multiple ? "group" : "radiogroup"} aria-label={prompt} className="space-y-2">
          {options.map((option, index) => (
            <label key={option.id} className={`flex ${busy ? "cursor-default" : "cursor-pointer"} items-start gap-3 rounded-md border p-3 transition-colors focus-within:ring-2 focus-within:ring-white/20 ${selected.includes(option.id) ? "border-glass-primary-border bg-glass-focus" : "border-glass-border"}`}>
              <input type={multiple ? "checkbox" : "radio"} className="accent-white" name={request.requestId} value={option.id} aria-label={option.label} aria-describedby={option.description ? `${fieldId}-${index}` : undefined} checked={selected.includes(option.id)} disabled={busy} onChange={() => setSelectedOptionIds((current) => multiple
                ? current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id]
                : [option.id])} />
              <span><span className="block">{option.label}</span>{option.description ? <span id={`${fieldId}-${index}`} className="block text-sm text-surface-muted">{option.description}</span> : null}</span>
            </label>
          ))}
        </div>
      ) : null}
      {confirmation || options.length > 0 ? (
        <div className="flex items-center gap-2">
          <Button type="button" fullWidth={false} size="sm" icon={<CheckmarkIcon />} disabled={busy || (options.length > 0 && selected.length === 0)}
            onClick={() => void respond(confirmation
              ? { requestId: request.requestId, optionId: "approve" }
              : selectionResponse(request, selected))}>
            Confirm
          </Button>
          <Button type="button" fullWidth={false} size="sm" variant="secondary" icon={<XIcon />} disabled={busy}
            onClick={() => void respond(confirmation
              ? { requestId: request.requestId, optionId: "deny" }
              : selectionResponse(request, selected, true))}>
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
        status === "completed" ? "Completed" : status === "cancelled" ? "Cancelled" : status === "failed" ? "Couldn't complete this response" : "Confirmed · working…"
      }</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </section>
  );
}
