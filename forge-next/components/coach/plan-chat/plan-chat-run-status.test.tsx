import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanChatRunStatus } from "@/components/coach/plan-chat/plan-chat-run-status";

describe("PlanChatRunStatus", () => {
  it("maps run status to a badge label", () => {
    render(
      <PlanChatRunStatus
        runStatus="generating"
        errors={[]}
        phase="streaming"
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Generating");
  });

  it("shows inline errors when present", () => {
    render(
      <PlanChatRunStatus
        runStatus="error"
        errors={[{ path: "/weeks", message: "Required" }]}
        phase="error"
      />,
    );
    expect(screen.getByText(/Required/)).toBeInTheDocument();
  });
});
