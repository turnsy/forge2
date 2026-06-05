import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlanChatThread } from "@/components/coach/plan-chat/plan-chat-thread";

describe("PlanChatThread", () => {
  it("shows run status as an assistant message with a spinner", () => {
    render(
      <PlanChatThread
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

  it("calls onRestart when the restart control is clicked", async () => {
    const user = userEvent.setup();
    const onRestart = vi.fn();
    render(
      <PlanChatThread
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
      <PlanChatThread
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
      <PlanChatThread
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
