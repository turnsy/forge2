import { PaperclipIcon } from "@/components/icons/paperclip-icon";
import { Spinner } from "@/components/ui";
import type { PlanChatAttachment } from "@/lib/plan-chat/types";

export function PlanChatAttachments({
  attachments,
}: {
  attachments: PlanChatAttachment[];
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <span
          key={attachment.localId}
          className={`inline-flex items-center gap-1.5 rounded-full border py-1.5 pl-3 pr-1.5 text-sm shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] ${
            attachment.status === "failed"
              ? "border-red-500/40 bg-red-500/10 text-red-200"
              : "border-glass-border bg-glass text-surface-foreground"
          }`}
        >
          {attachment.status === "uploading" ? (
            <Spinner className="h-3.5 w-3.5 border" label="Uploading" />
          ) : (
            <PaperclipIcon className="h-3.5 w-3.5 shrink-0 text-surface-muted" />
          )}
          <span className="max-w-[12rem] truncate">{attachment.displayLabel}</span>
          {attachment.status === "failed" && attachment.errorMessage ? (
            <span className="text-xs text-red-300/90">— {attachment.errorMessage}</span>
          ) : null}
          <button
            type="button"
            className="ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-surface-muted transition hover:bg-glass-focus hover:text-surface-foreground"
            aria-label={`Remove ${attachment.displayLabel}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
