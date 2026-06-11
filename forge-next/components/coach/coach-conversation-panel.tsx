"use client";

import type { ReactNode } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";

export function CoachConversationPanel({
  state,
  onAttach,
  onSend,
  composerHeader,
}: {
  state: PlanWorkspaceState;
  onAttach: (files: File[]) => void;
  onSend: Parameters<typeof ChatComposer>[0]["onSend"];
  composerHeader?: ReactNode;
}) {
  return (
    <>
      <ChatThread
        messages={state.messages}
        streamingAssistantText={state.streamingAssistantText}
        runStatus={state.runStatus}
        errors={state.errors}
        phase={state.phase}
      />
      <div className="shrink-0 py-2">
        {composerHeader}
        <ChatComposer
          compact
          state={state}
          composerKey={`${state.sessionId}-${state.messages.length}`}
          onAttach={onAttach}
          onSend={onSend}
        />
      </div>
    </>
  );
}
