"use client";

import type { ReactNode } from "react";
import { ChatAttachmentList } from "@/components/chat/chat-attachment";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import { OverlayScrollChrome } from "@/components/ui/overlay-scroll-chrome";
import { PAGE_CONTENT_INSET_X_CLASS } from "@/lib/layout/page-layout";
import {
  CHAT_THREAD_FALLBACK_TOP_CLASS,
  CHAT_THREAD_OVERLAY_TOP_GAP_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS,
} from "@/lib/coach/mobile-workspace-layout";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";

export function CoachConversationPanel({
  state,
  onAttach,
  onRemoveAttachment,
  onSend,
  onStop,
  onReset,
  promptEnabled = true,
  composerHeader,
  composerClassName = "",
  showAttachmentsAboveComposer = true,
  topChrome,
}: {
  state: PlanWorkspaceState;
  onAttach: (files: File[]) => void;
  onRemoveAttachment?: (localId: string) => void;
  onSend: Parameters<typeof ChatComposer>[0]["onSend"];
  onStop?: () => void;
  onReset?: () => void;
  promptEnabled?: boolean;
  composerHeader?: ReactNode;
  composerClassName?: string;
  showAttachmentsAboveComposer?: boolean;
  topChrome?: ReactNode;
}) {
  const composer = (
    <ChatComposer
      compact
      overlayChrome
      state={state}
      composerKey={`${state.sessionId}-${state.messages.length}`}
      onAttach={onAttach}
      onRemoveAttachment={onRemoveAttachment}
      onSend={onSend}
      onStop={onStop}
      onReset={onReset}
      promptEnabled={promptEnabled}
    />
  );

  const fallbackScrollBottomClass = composerHeader
    ? MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS
    : MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS;
  const preFooter =
    composerHeader ??
    (showAttachmentsAboveComposer && state.hasStarted ? (
      <ChatAttachmentList
        attachments={state.attachments}
        onRemove={onRemoveAttachment}
      />
    ) : null);

  return (
    <OverlayScrollChrome
      topChrome={topChrome}
      preFooter={preFooter}
      footer={composer}
      footerInsetClassName={composerClassName}
      contentInsetClassName={PAGE_CONTENT_INSET_X_CLASS}
    >
      {({ scrollPaddingTop, scrollPaddingBottom }) => {
        const scrollChromeReady =
          (!topChrome || scrollPaddingTop !== undefined) &&
          scrollPaddingBottom !== undefined;

        return (
          <ChatThread
            threadKey={state.sessionId}
            messages={state.messages}
            streamingAssistantText={state.streamingAssistantText}
            runStatus={state.runStatus}
            errors={state.errors}
            phase={state.phase}
            className="absolute inset-0 z-0"
            scrollClassName={`${
              scrollPaddingTop === undefined
                ? CHAT_THREAD_FALLBACK_TOP_CLASS
                : CHAT_THREAD_OVERLAY_TOP_GAP_CLASS
            } ${
              scrollPaddingBottom === undefined ? fallbackScrollBottomClass : ""
            } ${PAGE_CONTENT_INSET_X_CLASS}`}
            scrollPaddingTop={scrollPaddingTop}
            scrollPaddingBottom={scrollPaddingBottom}
            scrollChromeReady={scrollChromeReady}
          />
        );
      }}
    </OverlayScrollChrome>
  );
}
