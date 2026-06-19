"use client";

import type { ReactNode } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";

export function CoachConversationPanel({
  state,
  onAttach,
  onSend,
  promptEnabled = true,
  composerHeader,
  composerClassName = "",
}: {
  state: PlanWorkspaceState;
  onAttach: (files: File[]) => void;
  onSend: Parameters<typeof ChatComposer>[0]["onSend"];
  promptEnabled?: boolean;
  composerHeader?: ReactNode;
  composerClassName?: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ChatThread
        messages={state.messages}
        streamingAssistantText={state.streamingAssistantText}
        runStatus={state.runStatus}
        errors={state.errors}
        phase={state.phase}
      />
      <div
        className={`shrink-0 py-3 md:pb-2 md:pt-0${composerClassName ? ` ${composerClassName}` : ""}`}
      >
        {composerHeader}
        <ChatComposer
          compact
          state={state}
          composerKey={`${state.sessionId}-${state.messages.length}`}
          onAttach={onAttach}
          onSend={onSend}
          promptEnabled={promptEnabled}
        />
      </div>
    </div>
  );
}
