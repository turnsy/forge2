"use client";

import { ChatMessageBody } from "@/components/chat/chat-message-body";
import { ChatInputRequest } from "@/components/chat/chat-input-request";
import type { InputRequest, InputResponse } from "eve/client";
import { TurnActivityIndicator } from "@/components/chat/turn-activity-indicator";
import { ChatBubble } from "@/components/ui/chat-bubble";
import { MarkdownContent } from "@/components/ui/markdown-content";
import { hasVisibleChatContent } from "@/lib/chat/message-content";
import { isTurnInProgress, getTurnActivityLabel } from "@/lib/chat/turn-activity";
import { useChatThreadAutoScroll } from "@/lib/chat/use-chat-thread-scroll";
import {
  hasOverlayScrollLane,
  OVERLAY_SCROLL_LANE_CLASS,
  overlayScrollLaneStyle,
} from "@/lib/layout/overlay-scroll-lane";
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

export function ChatThread({
  threadKey,
  messages,
  streamingAssistantText,
  runStatus,
  errors,
  phase,
  className = "",
  scrollClassName = "",
  scrollPaddingTop,
  scrollPaddingBottom,
  scrollChromeReady = true,
  pendingInputRequests = [],
  onRespondToInput,
}: {
  threadKey: string;
  messages: ChatMessage[];
  streamingAssistantText: string;
  runStatus: ChatStatus | null;
  errors: ChatDisplayError[];
  phase: ChatWorkspacePhase;
  className?: string;
  scrollClassName?: string;
  scrollPaddingTop?: number;
  scrollPaddingBottom?: number;
  scrollChromeReady?: boolean;
  pendingInputRequests?: InputRequest[];
  onRespondToInput?: (response: InputResponse) => Promise<void>;
}) {
  const { scrollRef, contentRef } = useChatThreadAutoScroll({
    threadKey,
    messages,
    streamingAssistantText,
    runStatus,
    errors,
    phase,
    scrollPaddingTop,
    scrollPaddingBottom,
    scrollChromeReady,
  });

  const visibleStreamingText = streamingAssistantText.trim();
  const showStreaming =
    visibleStreamingText.length > 0 &&
    (messages.length === 0 ||
      messages[messages.length - 1]?.role !== "assistant" ||
      messages[messages.length - 1]?.content.trim() !== visibleStreamingText);

  const turnInProgress = isTurnInProgress(phase, runStatus);
  const activityLabel = turnInProgress
    ? getTurnActivityLabel(phase, runStatus)
    : null;
  const showTurnActivity = Boolean(activityLabel) && pendingInputRequests.length === 0;
  const showErrors = errors.length > 0;
  const lanePadding = { scrollPaddingTop, scrollPaddingBottom };
  const lanePositioned = hasOverlayScrollLane(lanePadding);

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden${className ? ` ${className}` : ""}`}
    >
      <div
        ref={scrollRef}
        className={
          lanePositioned
            ? OVERLAY_SCROLL_LANE_CLASS
            : "min-h-0 flex-1 overflow-y-auto"
        }
      >
        <div
          ref={contentRef}
          className={`flex flex-col gap-4 ${lanePositioned ? "" : "px-0 py-3 md:py-0"}${scrollClassName ? ` ${scrollClassName}` : ""}`}
          style={
            lanePositioned
              ? overlayScrollLaneStyle(lanePadding)
              : scrollPaddingTop !== undefined || scrollPaddingBottom !== undefined
                ? {
                    ...(scrollPaddingTop !== undefined
                      ? { paddingTop: scrollPaddingTop }
                      : {}),
                    ...(scrollPaddingBottom !== undefined
                      ? { paddingBottom: scrollPaddingBottom }
                      : {}),
                  }
                : undefined
          }
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
              {showTurnActivity && activityLabel ? (
                <TurnActivityIndicator label={activityLabel} />
              ) : null}
            </div>
          ) : showTurnActivity && activityLabel ? (
            <TurnActivityIndicator label={activityLabel} />
          ) : null}
          {pendingInputRequests.map((request) => (
            <ChatBubble key={request.requestId} role="assistant">
              {onRespondToInput ? (
                <ChatInputRequest request={request} disabled={turnInProgress} onRespond={onRespondToInput} />
              ) : <p>{request.prompt}</p>}
            </ChatBubble>
          ))}
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
        </div>
      </div>
    </div>
  );
}
