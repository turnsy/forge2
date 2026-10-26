/**
 * @vitest-environment jsdom
 */
import { fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useChatThreadAutoScroll } from "@/lib/chat/use-chat-thread-scroll";

function TestThread({
  scrollChromeReady,
  scrollPaddingBottom,
  streamingAssistantText = "",
  messages = [{ role: "user" as const, content: "Hello" }],
}: {
  scrollChromeReady: boolean;
  scrollPaddingBottom?: number;
  streamingAssistantText?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
}) {
  const { scrollRef, contentRef } = useChatThreadAutoScroll({
    threadKey: "thread-1",
    messages,
    streamingAssistantText,
    runStatus: null,
    errors: [],
    phase: "idle",
    scrollPaddingBottom,
    scrollChromeReady,
  });

  return (
    <div
      ref={scrollRef}
      data-testid="thread"
      style={{
        height: 400,
        overflow: "auto",
        paddingBottom: scrollPaddingBottom,
      }}
      data-scroll-height={1000}
    >
      <div ref={contentRef} style={{ height: 1000 }} />
    </div>
  );
}

describe("useChatThreadAutoScroll", () => {
  it("follows late content resizes without interrupting touch scrolling", () => {
    let notifyResize = () => {};
    const disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) { notifyResize = callback; }
      observe = vi.fn();
      disconnect = disconnect;
    });
    const viewport = mockViewport();
    const { getByTestId, unmount } = render(<TestThread scrollChromeReady />);
    const container = getByTestId("thread");
    viewport.scrollTo.mockClear();
    viewport.grow();
    notifyResize();
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({ top: 900, behavior: "instant" });

    viewport.scrollTo.mockClear();
    fireEvent.touchStart(container);
    viewport.grow();
    notifyResize();
    expect(viewport.scrollTo).not.toHaveBeenCalled();
    container.scrollTop = 100;
    fireEvent.scroll(container);
    fireEvent.touchEnd(container);
    notifyResize();
    expect(viewport.scrollTo).not.toHaveBeenCalled();
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
  });
  function mockViewport() {
    let height = 1000;
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(() => height);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(400);
    const scrollTo = vi.fn(function (this: HTMLElement, options: ScrollToOptions) {
      this.scrollTop = options.top ?? 0;
    });
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: scrollTo });
    return { scrollTo, grow: () => { height += 300; } };
  }

  it("follows a streaming response even when a chunk grows beyond the near-bottom threshold", () => {
    const viewport = mockViewport();
    const { rerender } = render(<TestThread scrollChromeReady streamingAssistantText="First chunk" />);
    viewport.scrollTo.mockClear();
    viewport.grow();
    rerender(<TestThread scrollChromeReady streamingAssistantText="A much longer chunk" />);
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({ top: 900, behavior: "instant" });
  });

  it("leaves touch scrolling alone during streaming and resumes after scrolling to the bottom", () => {
    const viewport = mockViewport();
    const { getByTestId, rerender } = render(<TestThread scrollChromeReady streamingAssistantText="First chunk" />);
    const container = getByTestId("thread");
    viewport.scrollTo.mockClear();
    fireEvent.touchStart(container);
    viewport.grow();
    rerender(<TestThread scrollChromeReady streamingAssistantText="Second chunk" />);
    expect(viewport.scrollTo).not.toHaveBeenCalled();
    container.scrollTop = 100;
    fireEvent.scroll(container);
    fireEvent.touchEnd(container);
    rerender(<TestThread scrollChromeReady streamingAssistantText="Third chunk" />);
    expect(viewport.scrollTo).not.toHaveBeenCalled();

    container.scrollTop = 900;
    fireEvent.scroll(container);
    viewport.grow();
    rerender(<TestThread scrollChromeReady streamingAssistantText="Fourth chunk" />);
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({ top: 1200, behavior: "instant" });
  });

  it("snaps to a newly sent user message after reading older messages", () => {
    const viewport = mockViewport();
    const { getByTestId, rerender } = render(<TestThread scrollChromeReady />);
    const container = getByTestId("thread");
    container.scrollTop = 0;
    fireEvent.scroll(container);
    viewport.scrollTo.mockClear();
    viewport.grow();
    rerender(<TestThread scrollChromeReady messages={[
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Reply" },
      { role: "user", content: "Follow up" },
    ]} />);
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({ top: 900, behavior: "instant" });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
