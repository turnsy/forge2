"use client";

import type { ReactNode } from "react";
import { ChatAttachmentList } from "@/components/chat/chat-attachment";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import { MobileOverlayScrollChrome } from "@/components/coach/mobile-overlay-scroll-chrome";
import {
  MOBILE_CHAT_CONTENT_INSET_X_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS,
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
  layout = "default",
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
  layout?: "default" | "mobileOverlay";
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

  if (layout === "mobileOverlay") {
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
      <MobileOverlayScrollChrome
        topChrome={topChrome}
        preFooter={preFooter}
        footer={composer}
        footerInsetClassName={composerClassName}
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
                ? MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS
                : ""
            } ${
              scrollPaddingBottom === undefined
                ? fallbackScrollBottomClass
                : ""
            } ${MOBILE_CHAT_CONTENT_INSET_X_CLASS}`}
            scrollPaddingTop={scrollPaddingTop}
            scrollPaddingBottom={scrollPaddingBottom}
            scrollChromeReady={scrollChromeReady}
          />
          );
        }}
      </MobileOverlayScrollChrome>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatThread
        threadKey={state.sessionId}
        messages={state.messages}
        streamingAssistantText={state.streamingAssistantText}
        runStatus={state.runStatus}
        errors={state.errors}
        phase={state.phase}
      />
      <div
        className={`shrink-0 py-3 md:py-0${composerClassName ? ` ${composerClassName}` : ""}`}
      >
        {composerHeader}
        {showAttachmentsAboveComposer && state.hasStarted ? (
          <ChatAttachmentList
            attachments={state.attachments}
            onRemove={onRemoveAttachment}
            className="mb-2"
          />
        ) : null}
        {composer}
      </div>
    </div>
  );
}
