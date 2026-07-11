import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoachConversationPanel } from "@/components/coach/coach-conversation-panel";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";

describe("CoachConversationPanel", () => {
  it("renders attachments above the composer once the thread has started", () => {
    render(
      <CoachConversationPanel
        state={{
          ...createInitialChatWorkspaceState(),
          hasStarted: true,
          attachments: [
            {
              localId: "attach-1",
              status: "uploaded",
              displayLabel: "my plan.csv",
            },
          ],
        }}
        onAttach={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    const chip = screen.getByText("my plan.csv");
    const attachButton = screen.getByRole("button", { name: "Attach" });
    expect(
      chip.compareDocumentPosition(attachButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(chip.closest(".rounded-card")).toBeNull();
  });
});
