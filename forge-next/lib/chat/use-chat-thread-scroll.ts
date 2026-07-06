"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import {
  isChatThreadNearBottom,
  shouldAutoScrollChatThread,
} from "@/lib/chat/chat-thread-scroll";
import type {
  ChatDisplayError,
  ChatMessage,
  ChatStatus,
  ChatWorkspacePhase,
} from "@/lib/chat/types";

export function useChatThreadAutoScroll({
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const previousThreadKeyRef = useRef(threadKey);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    bottomRef.current?.scrollIntoView?.({ behavior, block: "end" });
  }, []);

  useLayoutEffect(() => {
    if (previousThreadKeyRef.current !== threadKey) {
      previousThreadKeyRef.current = threadKey;
      previousMessageCountRef.current = 0;
    }

    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const messageCount = messages.length;
    const lastMessage = messages[messageCount - 1];
    const nearBottom = isChatThreadNearBottom(container);
    const shouldScroll = shouldAutoScrollChatThread({
      previousMessageCount: previousMessageCountRef.current,
      messageCount,
      lastMessageRole: lastMessage?.role,
      isNearBottom: nearBottom,
    });

    if (shouldScroll) {
      const isInitialLoad =
        previousMessageCountRef.current === 0 && messageCount > 0;
      scrollToBottom(isInitialLoad ? "instant" : "smooth");
    }

    previousMessageCountRef.current = messageCount;
  }, [
    errors,
    messages,
    phase,
    runStatus,
    scrollToBottom,
    streamingAssistantText,
    threadKey,
  ]);

  return { scrollRef, bottomRef };
}
