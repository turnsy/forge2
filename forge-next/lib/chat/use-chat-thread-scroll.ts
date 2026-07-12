"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import {
  isChatThreadNearBottom,
  scrollChatThreadToBottom,
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
  scrollPaddingTop,
  scrollPaddingBottom,
  scrollChromeReady = true,
}: {
  threadKey: string;
  messages: ChatMessage[];
  streamingAssistantText: string;
  runStatus: ChatStatus | null;
  errors: ChatDisplayError[];
  phase: ChatWorkspacePhase;
  scrollPaddingTop?: number;
  scrollPaddingBottom?: number;
  scrollChromeReady?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const previousThreadKeyRef = useRef(threadKey);
  const initialScrollPendingRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    scrollChatThreadToBottom(container, behavior);
  }, []);

  useLayoutEffect(() => {
    if (previousThreadKeyRef.current !== threadKey) {
      previousThreadKeyRef.current = threadKey;
      previousMessageCountRef.current = 0;
      initialScrollPendingRef.current = messages.length > 0;
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
    const isInitialLoad =
      previousMessageCountRef.current === 0 && messageCount > 0;

    if (
      initialScrollPendingRef.current &&
      messageCount > 0 &&
      scrollChromeReady
    ) {
      scrollToBottom("instant");
      initialScrollPendingRef.current = false;
    } else if (shouldScroll) {
      scrollToBottom(isInitialLoad ? "instant" : "smooth");
      initialScrollPendingRef.current = messageCount > 0 && !scrollChromeReady;
    } else if (
      scrollPaddingBottom !== undefined &&
      nearBottom &&
      messageCount > 0
    ) {
      scrollToBottom("instant");
    }

    previousMessageCountRef.current = messageCount;
  }, [
    errors,
    messages,
    phase,
    runStatus,
    scrollChromeReady,
    scrollPaddingBottom,
    scrollPaddingTop,
    scrollToBottom,
    streamingAssistantText,
    threadKey,
  ]);

  return { scrollRef };
}
