import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatThread } from "@/components/chat/chat-thread";

describe("ChatThread", () => {
  it("shows run status below messages as an assistant bubble with a spinner", () => {
    render(
      <ChatThread
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

  it("renders streaming text before the run status bubble", () => {
    const { container } = render(
      <ChatThread
        messages={[{ role: "user", content: "Hi" }]}
        streamingAssistantText="Partial reply"
        runStatus="generating"
        errors={[]}
        phase="streaming"
      />,
    );
    const scrollPane = container.querySelector(".overflow-y-auto");
    expect(scrollPane?.textContent).toMatch(/Hi[\s\S]*Partial reply[\s\S]*Generating/);
  });

  it("shows inline errors in the thread", () => {
    render(
      <ChatThread
        messages={[]}
        streamingAssistantText=""
        runStatus="error"
        errors={[{ path: "/weeks", message: "Required" }]}
        phase="error"
      />,
    );
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });

  it("does not render whitespace-only assistant messages", () => {
    const { container } = render(
      <ChatThread
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
});
