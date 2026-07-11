import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatThread } from "@/components/chat/chat-thread";

describe("ChatThread", () => {
  it("shows run status below messages as an assistant bubble with a spinner", () => {
    render(
      <ChatThread
        threadKey="thread-1"
        messages={[{ role: "user", content: "Build a plan" }]}
        streamingAssistantText=""
        runStatus="generating"
        errors={[]}
        phase="streaming"
      />,
    );
    expect(screen.getByText("Generating")).toBeInTheDocument();
    expect(screen.getByLabelText("Generating")).toBeInTheDocument();
  });

  it("keeps a generating indicator visible while assistant text is streaming", () => {
    render(
      <ChatThread
        threadKey="thread-1"
        messages={[{ role: "user", content: "Hi" }]}
        streamingAssistantText="Partial reply"
        runStatus="generating"
        errors={[]}
        phase="streaming"
      />,
    );

    expect(screen.getByText("Partial reply")).toBeInTheDocument();
    expect(screen.getByText("Generating")).toBeInTheDocument();
    expect(screen.getByLabelText("Generating")).toBeInTheDocument();
  });

  it("shows builder status under an intermediate assistant message", () => {
    render(
      <ChatThread
        threadKey="thread-1"
        messages={[{ role: "user", content: "Build from this" }]}
        streamingAssistantText="I'll read your spreadsheet first."
        runStatus="sandbox"
        errors={[]}
        phase="streaming"
      />,
    );

    expect(
      screen.getByText("I'll read your spreadsheet first."),
    ).toBeInTheDocument();
    expect(screen.getByText("Running builder")).toBeInTheDocument();
  });

  it("shows inline errors in the thread", () => {
    render(
      <ChatThread
        threadKey="thread-1"
        messages={[]}
        streamingAssistantText=""
        runStatus="error"
        errors={[{ path: "/weeks", message: "Required" }]}
        phase="error"
      />,
    );
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("shows interrupted-run errors after the stream ends", () => {
    render(
      <ChatThread
        threadKey="thread-1"
        messages={[{ role: "user", content: "Build from my sheet" }]}
        streamingAssistantText=""
        runStatus="error"
        errors={[
          {
            code: "STREAM_INTERRUPTED",
            message: "The request stopped before finishing.",
          },
        ]}
        phase="error"
      />,
    );

    expect(screen.getByText(/stopped before finishing/i)).toBeInTheDocument();
    expect(screen.queryByText("Generating")).not.toBeInTheDocument();
  });

  it("does not render whitespace-only assistant messages", () => {
    const { container } = render(
      <ChatThread
        threadKey="thread-1"
        messages={[
          { role: "user", content: "Hi" },
          { role: "assistant", content: "   " },
        ]}
        streamingAssistantText=""
        runStatus={null}
        errors={[]}
        phase="idle"
      />,
    );

    expect(screen.getByText("Hi")).toBeInTheDocument();
    expect(container.querySelectorAll(".justify-start .rounded-card")).toHaveLength(0);
  });

  it("does not render a streaming bubble for whitespace-only text", () => {
    const { container } = render(
      <ChatThread
        threadKey="thread-1"
        messages={[{ role: "user", content: "Hi" }]}
        streamingAssistantText="   "
        runStatus="generating"
        errors={[]}
        phase="streaming"
      />,
    );

    const scrollPane = container.querySelector(".overflow-y-auto");
    expect(scrollPane?.textContent).toMatch(/Hi[\s\S]*Generating/);
    expect(scrollPane?.textContent).not.toMatch(/\s{3,}/);
  });

  it("scrolls to the bottom when a thread is loaded", () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    render(
      <ChatThread
        threadKey="thread-1"
        messages={[
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there" },
        ]}
        streamingAssistantText=""
        runStatus={null}
        errors={[]}
        phase="idle"
      />,
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "instant",
      block: "end",
    });
  });
});
