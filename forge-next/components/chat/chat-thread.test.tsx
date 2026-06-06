import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("calls onRestart when the restart control is clicked", async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    render(
      <ChatThread
        messages={[]}
        streamingAssistantText=""
        runStatus={null}
        errors={[]}
        phase="idle"
        onRestart={onRestart}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Restart workspace" }));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it("disables restart while chat is running", () => {
    render(
      <ChatThread
        messages={[]}
        streamingAssistantText=""
        runStatus="generating"
        errors={[]}
        phase="streaming"
        onRestart={vi.fn()}
        restartDisabled
      />,
    );
    expect(
      screen.getByRole("button", { name: "Restart workspace" }),
    ).toBeDisabled();
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
});
