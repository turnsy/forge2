import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
