"use client";

import type { ReactNode } from "react";
import { ChatAttachmentList } from "@/components/chat/chat-attachment";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import {
  MOBILE_CHAT_COMPOSER_SURFACE_CLASS,
  MOBILE_CHAT_FOOTER_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_BOTTOM_WITH_TOOLBAR_CLASS,
  MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS,
  MOBILE_CHAT_TOOLBAR_TO_COMPOSER_FADE_CLASS,
  MOBILE_CHAT_TOP_FADE_CLASS,
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
          scrollClassName={`${MOBILE_CHAT_THREAD_SCROLL_TOP_CLASS} ${scrollBottomClass}`}
        />
        {topChrome ? (
          <div className={MOBILE_CHAT_TOP_OVERLAY_CLASS}>
            <div aria-hidden className={MOBILE_CHAT_TOP_FADE_CLASS} />
            <div className="relative z-10 pointer-events-auto pb-4">
              {topChrome}
            </div>
          </div>
        ) : null}
        <div
          className={`${MOBILE_CHAT_FOOTER_CLASS}${composerClassName ? ` ${composerClassName}` : ""}`}
        >
          {composerHeader ? (
            <div className="relative z-10 pointer-events-auto">
              {composerHeader}
            </div>
          ) : showAttachmentsAboveComposer && state.hasStarted ? (
            <div className={`relative ${MOBILE_CHAT_COMPOSER_SURFACE_CLASS}`}>
              <ChatAttachmentList
                attachments={state.attachments}
                onRemove={onRemoveAttachment}
                className="mb-2"
              />
            </div>
          ) : null}
          {composerHeader ? (
            <div aria-hidden className={MOBILE_CHAT_TOOLBAR_TO_COMPOSER_FADE_CLASS} />
          ) : null}
          <div className={`relative z-10 shrink-0 ${MOBILE_CHAT_COMPOSER_SURFACE_CLASS}`}>
            {composer}
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
