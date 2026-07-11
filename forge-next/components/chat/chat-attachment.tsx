import { PaperclipIcon } from "@/components/icons/paperclip-icon";
import { Spinner } from "@/components/ui";
import { attachmentChipClass } from "@/lib/theme";
import type { ChatAttachment as ChatAttachmentModel } from "@/lib/chat/types";

export function ChatAttachment({
  attachment,
  onRemove,
}: {
  attachment: ChatAttachmentModel;
  onRemove?: (localId: string) => void;
}) {
  const tone = attachment.status === "failed" ? "error" : "default";
  const canRemove =
    Boolean(onRemove) &&
    attachment.status !== "uploading" &&
    attachment.status !== "pending";

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
      {canRemove ? (
        <button
          type="button"
          className="ml-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-surface-muted transition hover:bg-glass-focus hover:text-surface-foreground"
          aria-label={`Remove ${attachment.displayLabel}`}
          onClick={() => onRemove?.(attachment.localId)}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export function ChatAttachmentList({
  attachments,
  onRemove,
  className = "",
  wrap = true,
}: {
  attachments: ChatAttachmentModel[];
  onRemove?: (localId: string) => void;
  className?: string;
  wrap?: boolean;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex gap-2 ${wrap ? "flex-wrap" : "flex-nowrap"} ${className}`.trim()}
    >
      {attachments.map((attachment) => (
        <ChatAttachment
          key={attachment.localId}
          attachment={attachment}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
