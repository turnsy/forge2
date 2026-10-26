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
  const followingRef = useRef(true);
  const touchingRef = useRef(false);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    followingRef.current = true;
    touchingRef.current = false;
    const onScroll = () => {
      followingRef.current = isChatThreadNearBottom(container);
    };
    const onTouchStart = () => { touchingRef.current = true; };
    const onTouchEnd = () => {
      touchingRef.current = false;
      onScroll();
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [threadKey]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    scrollChatThreadToBottom(container, behavior);
    followingRef.current = true;
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
    // Read the position recorded before this render grew the content.
    const nearBottom = followingRef.current;
    const shouldScroll = shouldAutoScrollChatThread({
      previousMessageCount: previousMessageCountRef.current,
      messageCount,
      lastMessageRole: lastMessage?.role,
      isNearBottom: nearBottom,
    });
    if (touchingRef.current) {
      // Streaming must never cancel a native touch gesture.
    } else if (
      initialScrollPendingRef.current &&
      messageCount > 0 &&
      scrollChromeReady
    ) {
      scrollToBottom("instant");
      initialScrollPendingRef.current = false;
    } else if (shouldScroll) {
      // Repeated smooth scrolls restart the animation and fight touch/momentum
      // scrolling on mobile. Snap once per update while following instead.
      scrollToBottom("instant");
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
