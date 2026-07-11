"use client";

import type { ReactNode } from "react";
import { ChatAttachmentList } from "@/components/chat/chat-attachment";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
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
}) {
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
      </div>
    </div>
  );
}
