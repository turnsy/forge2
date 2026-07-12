"use client";

import type { ReactNode } from "react";
import { ChatAttachmentList } from "@/components/chat/chat-attachment";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import {
  MOBILE_CHAT_CHROME_BACKDROP_CLASS,
  MOBILE_CHAT_CONTENT_INSET_X_CLASS,
  MOBILE_CHAT_FOOTER_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS,
  MOBILE_CHAT_TOP_BLUR_CLASS,
  MOBILE_CHAT_TOP_OVERLAY_CLASS,
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
    const scrollBottomClass = composerHeader
      ? MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS
      : MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS;

    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatThread
          threadKey={state.sessionId}
          messages={state.messages}
          streamingAssistantText={state.streamingAssistantText}
          runStatus={state.runStatus}
          errors={state.errors}
          phase={state.phase}
          className="absolute inset-0 z-0"
          scrollClassName={`${MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS} ${scrollBottomClass} ${MOBILE_CHAT_CONTENT_INSET_X_CLASS}`}
        />
        {topChrome ? (
          <div className={MOBILE_CHAT_TOP_OVERLAY_CLASS}>
            <div aria-hidden className={MOBILE_CHAT_TOP_BLUR_CLASS} />
            <div
              className={`relative z-10 pointer-events-auto pb-2 ${MOBILE_CHAT_CONTENT_INSET_X_CLASS}`}
            >
              {topChrome}
            </div>
          </div>
        ) : null}
        <div
          className={`${MOBILE_CHAT_FOOTER_CLASS}${composerClassName ? ` ${composerClassName}` : ""}`}
        >
          {composerHeader ? (
            <div
              className={`relative pointer-events-auto ${MOBILE_CHAT_CONTENT_INSET_X_CLASS}`}
            >
              <div aria-hidden className={MOBILE_CHAT_CHROME_BACKDROP_CLASS} />
              <div className="relative z-10">{composerHeader}</div>
            </div>
          ) : showAttachmentsAboveComposer && state.hasStarted ? (
            <div
              className={`relative pointer-events-auto ${MOBILE_CHAT_CONTENT_INSET_X_CLASS}`}
            >
              <div aria-hidden className={MOBILE_CHAT_CHROME_BACKDROP_CLASS} />
              <div className="relative z-10">
                <ChatAttachmentList
                  attachments={state.attachments}
                  onRemove={onRemoveAttachment}
                  className="mb-2"
                />
              </div>
            </div>
          ) : null}
          <div
            className={`relative z-10 shrink-0 pointer-events-auto ${MOBILE_CHAT_CONTENT_INSET_X_CLASS}`}
          >
            <div aria-hidden className={MOBILE_CHAT_CHROME_BACKDROP_CLASS} />
            <div className="relative z-10">{composer}</div>
          </div>
        </div>
      </div>
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
