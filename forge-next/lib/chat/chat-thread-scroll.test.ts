import { describe, expect, it, vi } from "vitest";
import {
  getChatThreadMaxScrollTop,
  isChatThreadNearBottom,
  scrollChatThreadToBottom,
  shouldAutoScrollChatThread,
} from "@/lib/chat/chat-thread-scroll";

describe("chat thread scroll", () => {
  it("computes the maximum scroll offset", () => {
    expect(
      getChatThreadMaxScrollTop({
        scrollHeight: 1000,
        clientHeight: 80,
      }),
    ).toBe(920);
  });

  it("scrolls the container to the true bottom including padding", () => {
    const container = {
      scrollHeight: 1000,
      clientHeight: 80,
      scrollTop: 0,
      scrollTo: vi.fn(),
    } as unknown as HTMLElement;

    scrollChatThreadToBottom(container, "smooth");

    expect(container.scrollTo).toHaveBeenCalledWith({
      top: 920,
      behavior: "smooth",
    });
  });

  it("detects when the viewport is near the bottom", () => {
    expect(
      isChatThreadNearBottom({
        scrollHeight: 1000,
        scrollTop: 900,
        clientHeight: 80,
      }),
    ).toBe(true);

    expect(
      isChatThreadNearBottom({
        scrollHeight: 1000,
        scrollTop: 100,
        clientHeight: 80,
      }),
    ).toBe(false);
  });

  it("scrolls on initial thread load", () => {
    expect(
      shouldAutoScrollChatThread({
        previousMessageCount: 0,
        messageCount: 4,
        isNearBottom: false,
      }),
    ).toBe(true);
  });

  it("scrolls when the user sends a message", () => {
    expect(
      shouldAutoScrollChatThread({
        previousMessageCount: 2,
        messageCount: 3,
        lastMessageRole: "user",
        isNearBottom: false,
      }),
    ).toBe(true);
  });

  it("only scrolls for assistant updates when already near the bottom", () => {
    expect(
      shouldAutoScrollChatThread({
        previousMessageCount: 2,
        messageCount: 3,
        lastMessageRole: "assistant",
        isNearBottom: true,
      }),
    ).toBe(true);

    expect(
      shouldAutoScrollChatThread({
        previousMessageCount: 2,
        messageCount: 3,
        lastMessageRole: "assistant",
        isNearBottom: false,
      }),
    ).toBe(false);
  });

  it("keeps following streaming updates when near the bottom", () => {
    expect(
      shouldAutoScrollChatThread({
        previousMessageCount: 3,
        messageCount: 3,
        isNearBottom: true,
      }),
    ).toBe(true);
  });
});
