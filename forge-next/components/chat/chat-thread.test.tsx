import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatThread } from "@/components/chat/chat-thread";

describe("ChatThread", () => {
  it("makes a chat-resolved pending card editable again after delivery failure", () => {
    const request = { requestId: "q", prompt: "Which athlete?", display: "select" as const, options: [{ id: "jay", label: "Jay" }, { id: "jane", label: "Jane" }], action: { kind: "tool-call" as const, callId: "q", toolName: "ask_question", input: {} } };
    const onDraftChange = vi.fn();
    render(<ChatThread threadKey="thread" messages={[{ role: "assistant", content: "", inputCard: { request, status: "replied", selectedChoiceIds: ["jay"] } }]} streamingAssistantText="" runStatus="error" errors={[{ message: "Network down" }]} phase="error" pendingInputRequests={[request]} onRespondToInput={vi.fn()} onInputDraftChange={onDraftChange} />);
    expect(screen.getByRole("radio", { name: "Jay" })).toBeEnabled();
    expect(screen.getByRole("radio", { name: "Jay" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders sent attachments on their message without a remove control", () => {
    render(<ChatThread threadKey="thread" messages={[
      { role: "user", content: "Use this image", attachments: [{ localId: "file", status: "uploaded", displayLabel: "plan.png" }] },
      { role: "assistant", content: "Done" },
      { role: "user", content: "Next question" },
    ]} streamingAssistantText="" runStatus="done" errors={[]} phase="idle" />);
    expect(screen.getByText("plan.png")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove plan.png" })).not.toBeInTheDocument();
  });

  it("renders approval controls instead of a spinner for a parked assignment", () => {
    render(<ChatThread threadKey="thread-1" messages={[{ role: "user", content: "Assign Jay" }]}
      streamingAssistantText="" runStatus="done" errors={[]} phase="idle" onRespondToInput={vi.fn()}
      pendingInputRequests={[{
        requestId: "approval-1", prompt: "Assign this plan to Jay?", display: "confirmation",
        options: [{ id: "approve", label: "Approve" }, { id: "deny", label: "Deny" }],
        action: { kind: "tool-call", callId: "call-1", toolName: "assign_plan", input: {} },
      }]} />);
    expect(screen.getByRole("region", { name: "Approval needed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(screen.queryByText("Thinking…")).not.toBeInTheDocument();
  });
  it("shows the turn activity indicator while a turn is in progress", () => {
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

    expect(screen.getByLabelText("Generating")).toBeInTheDocument();
    expect(screen.getByText("Generating")).toBeInTheDocument();
  });

  it("keeps the turn activity indicator visible while assistant text is streaming", () => {
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
  });

  it("shows builder status during sandbox work", () => {
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
    expect(screen.getByText("Building")).toBeInTheDocument();
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

  it("shows the turn activity indicator for whitespace-only streaming text", () => {
    render(
      <ChatThread
        threadKey="thread-1"
        messages={[{ role: "user", content: "Hi" }]}
        streamingAssistantText="   "
        runStatus="generating"
        errors={[]}
        phase="streaming"
      />,
    );

    expect(screen.getByText("Generating")).toBeInTheDocument();
  });

  it("hides the turn activity indicator when the turn is terminal", () => {
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

    expect(screen.queryByText("Generating")).not.toBeInTheDocument();
  });

  it("applies measured scroll padding when provided", () => {
    const { container } = render(
      <ChatThread
        threadKey="thread-1"
        messages={[{ role: "user", content: "Hello" }]}
        streamingAssistantText=""
        runStatus={null}
        errors={[]}
        phase="idle"
        scrollPaddingTop={52}
        scrollPaddingBottom={180}
      />,
    );

    const scrollContent = container.querySelector(".overflow-y-auto > div");
    expect(scrollContent).toHaveStyle({
      paddingTop: "52px",
      paddingBottom: "180px",
    });
  });

  it("scrolls to the bottom when a thread is loaded", () => {
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
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

    expect(scrollTo).toHaveBeenCalledWith({
      behavior: "instant",
      top: expect.any(Number),
    });
  });
});
