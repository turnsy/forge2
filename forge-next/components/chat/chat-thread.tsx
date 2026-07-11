"use client";

import { ChatMessageBody } from "@/components/chat/chat-message-body";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { Spinner } from "@/components/ui";
import {
  getRunStatusLabel,
  isActiveRunStatus,
} from "@/lib/chat/run-status-copy";
import { hasVisibleChatContent } from "@/lib/chat/message-content";
import { useChatThreadAutoScroll } from "@/lib/chat/use-chat-thread-scroll";
import type {
  ChatDisplayError,
  ChatMessage,
  ChatStatus,
  ChatWorkspacePhase,
} from "@/lib/chat/types";

function isRenderableMessage(message: ChatMessage): boolean {
  if (message.role === "user") {
    return true;
  }

  return hasVisibleChatContent(message.content);
}

function resolveStatusLabel(
  phase: ChatWorkspacePhase,
  runStatus: ChatStatus | null,
): string | null {
  if (phase === "uploading") {
    return "Uploading files…";
  }

  if (runStatus && isActiveRunStatus(runStatus)) {
    return getRunStatusLabel(runStatus);
  }

  if (phase === "streaming") {
    return "Thinking…";
  }

  return null;
}

export function ChatThread({
  threadKey,
  messages,
  streamingAssistantText,
  runStatus,
  errors,
  phase,
}: {
  threadKey: string;
  messages: ChatMessage[];
  streamingAssistantText: string;
  runStatus: ChatStatus | null;
  errors: ChatDisplayError[];
  phase: ChatWorkspacePhase;
}) {
  const { scrollRef, bottomRef } = useChatThreadAutoScroll({
    threadKey,
    messages,
    streamingAssistantText,
    runStatus,
    errors,
    phase,
  });

  const visibleStreamingText = streamingAssistantText.trim();
  const showStreaming =
    visibleStreamingText.length > 0 &&
    (messages.length === 0 ||
      messages[messages.length - 1]?.role !== "assistant" ||
      messages[messages.length - 1]?.content.trim() !== visibleStreamingText);

  const turnInProgress =
    phase === "uploading" ||
    phase === "streaming" ||
    (runStatus !== null && isActiveRunStatus(runStatus));

  const statusLabel = turnInProgress
    ? resolveStatusLabel(phase, runStatus)
    : null;

  const showStandaloneStatus =
    turnInProgress && visibleStreamingText.length === 0 && Boolean(statusLabel);

  const showStreamingStatus =
    turnInProgress &&
    visibleStreamingText.length > 0 &&
    showStreaming &&
    Boolean(statusLabel);

  const showErrors = errors.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-0 py-3 md:py-0"
      >
        {messages.filter(isRenderableMessage).map((message, index) => (
          <ChatBubble key={`${message.role}-${index}`} role={message.role}>
            <ChatMessageBody message={message} />
          </ChatBubble>
        ))}
        {showStreaming ? (
          <div className="flex flex-col gap-2">
            <ChatBubble role="assistant" isStreaming={turnInProgress}>
              <MarkdownContent content={visibleStreamingText} />
            </ChatBubble>
            {showStreamingStatus && statusLabel ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-1 text-sm text-surface-muted">
                  <Spinner
                    className="h-3.5 w-3.5 shrink-0 border"
                    label={statusLabel}
                  />
                  <span>{statusLabel}</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
        {showStandaloneStatus && statusLabel ? (
          <ChatBubble role="assistant">
            <div className="flex items-center gap-2.5 text-surface-muted">
              <Spinner className="h-4 w-4 shrink-0 border" label={statusLabel} />
              <span>{statusLabel}</span>
            </div>
          </ChatBubble>
        ) : null}
        {showErrors ? (
          <ChatBubble role="assistant">
            <ul className="space-y-1 text-sm text-red-300/95" role="alert">
              {errors.map((error, index) => (
                <li key={`${error.message}-${index}`}>
                  {error.path ? (
                    <span className="font-mono text-xs text-red-200/80">
                      {error.path}:{" "}
                    </span>
                  ) : null}
                  {error.message}
                </li>
              ))}
            </ul>
          </ChatBubble>
        ) : null}
        <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
      </div>
    </div>
  );
}
