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
  const { scrollRef } = useChatThreadAutoScroll({
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
      style={{
        height: 400,
        overflow: "auto",
        paddingBottom: scrollPaddingBottom,
      }}
      data-scroll-height={1000}
    >
      <div style={{ height: 1000 }} />
    </div>
  );
}

describe("useChatThreadAutoScroll", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scrolls again when overlay chrome padding becomes ready on initial load", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });

    const { rerender } = render(
      <TestThread scrollChromeReady={false} scrollPaddingBottom={undefined} />,
    );

    expect(scrollTo).toHaveBeenCalledTimes(1);

    rerender(
      <TestThread scrollChromeReady={true} scrollPaddingBottom={180} />,
    );

    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(scrollTo).toHaveBeenLastCalledWith({
      behavior: "instant",
      top: expect.any(Number),
    });
  });
});
