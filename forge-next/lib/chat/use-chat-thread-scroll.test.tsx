/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useChatThreadAutoScroll } from "@/lib/chat/use-chat-thread-scroll";

function TestThread({
  scrollChromeReady,
  scrollPaddingBottom,
}: {
  scrollChromeReady: boolean;
  scrollPaddingBottom?: number;
}) {
  const { scrollRef, bottomRef } = useChatThreadAutoScroll({
    threadKey: "thread-1",
    messages: [{ role: "user", content: "Hello" }],
    streamingAssistantText: "",
    runStatus: null,
    errors: [],
    phase: "idle",
    scrollPaddingBottom,
    scrollChromeReady,
  });

  return (
    <div
      ref={scrollRef}
      style={{ height: 400, overflow: "auto" }}
      data-scroll-height={1000}
    >
      <div style={{ height: 1000 }} />
      <div ref={bottomRef} />
    </div>
  );
}

describe("useChatThreadAutoScroll", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scrolls again when overlay chrome padding becomes ready on initial load", () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    const { rerender } = render(
      <TestThread scrollChromeReady={false} scrollPaddingBottom={undefined} />,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);

    rerender(
      <TestThread scrollChromeReady={true} scrollPaddingBottom={180} />,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(scrollIntoView).toHaveBeenLastCalledWith({
      behavior: "instant",
      block: "end",
    });
  });
});
