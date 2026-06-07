"use client";

import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatThread } from "@/components/chat/chat-thread";
import { isChatRunning } from "@/lib/chat";
import type { PlanWorkspaceState } from "@/lib/chat/adapters/plan/types";

export function CenteredChatLayout({
  state,
  onAttach,
  onSend,
  onRestart,
}: {
  state: PlanWorkspaceState;
  onAttach: (files: File[]) => void;
  onSend: Parameters<typeof ChatComposer>[0]["onSend"];
  onRestart: () => void;
}) {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl min-h-0 flex-1 flex-col px-4 md:px-6">
      <ChatThread
        messages={state.messages}
        streamingAssistantText={state.streamingAssistantText}
        runStatus={state.runStatus}
        errors={state.errors}
        phase={state.phase}
        onRestart={onRestart}
        restartDisabled={isChatRunning(state)}
      />
      <div className="shrink-0 border-t border-glass-border py-2">
        <ChatComposer
          compact
          state={state}
          composerKey={`${state.sessionId}-${state.messages.length}`}
          onAttach={onAttach}
          onSend={onSend}
        />
      </div>
    </div>
  );
}
