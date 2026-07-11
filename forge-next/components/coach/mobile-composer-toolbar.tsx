"use client";

import type { ReactNode } from "react";
import { ChatAttachmentList } from "@/components/chat/chat-attachment";
import {
  MOBILE_COMPOSER_ATTACHMENT_SCROLL_CLASS,
  MOBILE_COMPOSER_TOOLBAR_ROW_CLASS,
  MOBILE_COMPOSER_VIEW_OVERLAY_CLASS,
} from "@/lib/coach/mobile-workspace-layout";
import type { ChatAttachment } from "@/lib/chat/types";

export function MobileComposerToolbar({
  attachments,
  onRemoveAttachment,
  trailing,
}: {
  attachments: ChatAttachment[];
  onRemoveAttachment?: (localId: string) => void;
  trailing: ReactNode;
}) {
  return (
    <div className={MOBILE_COMPOSER_TOOLBAR_ROW_CLASS}>
      {attachments.length > 0 ? (
        <div className={MOBILE_COMPOSER_ATTACHMENT_SCROLL_CLASS}>
          <ChatAttachmentList
            attachments={attachments}
            onRemove={onRemoveAttachment}
            wrap={false}
            className={`min-w-min items-center pr-[5.75rem]`}
          />
        </div>
      ) : null}
      <div className={MOBILE_COMPOSER_VIEW_OVERLAY_CLASS}>
        <div className="pointer-events-auto">{trailing}</div>
      </div>
    </div>
  );
}
