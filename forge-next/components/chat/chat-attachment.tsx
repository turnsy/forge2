import { PaperclipIcon } from "@/components/icons/paperclip-icon";
import { Spinner } from "@/components/ui";
import { attachmentChipClass } from "@/lib/theme";
import type { ChatAttachment as ChatAttachmentModel } from "@/lib/chat/types";

export function ChatAttachment({
  attachment,
}: {
  attachment: ChatAttachmentModel;
}) {
  const tone = attachment.status === "failed" ? "error" : "default";

  return (
    <span className={attachmentChipClass(tone)}>
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
  );
}
