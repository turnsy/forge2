import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoachConversationPanel } from "@/components/coach/coach-conversation-panel";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import { MOBILE_CHAT_FOOTER_CLASS } from "@/lib/coach/mobile-workspace-layout";

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

  it("uses progressive blur on mobile so the thread scrolls under chrome", () => {
    const { container } = render(
      <CoachConversationPanel
        layout="mobileOverlay"
        topChrome={<button type="button">History</button>}
        composerHeader={<button type="button">View</button>}
        composerClassName="pb-[calc(4.5rem+0.75rem+env(safe-area-inset-bottom,0px))]"
        state={{
          ...createInitialChatWorkspaceState(),
          hasStarted: true,
          messages: [{ role: "user", content: "Hello" }],
        }}
        onAttach={vi.fn()}
        onSend={vi.fn()}
      />,
    );

    expect(container.querySelector("[style*='linear-gradient']")).not.toBeNull();
    expect(container.innerHTML).toContain(MOBILE_CHAT_FOOTER_CLASS);
    expect(container.querySelector(".absolute.inset-0")).not.toBeNull();
    expect(container.querySelector(".bg-gradient-to-b")).toBeNull();
    expect(container.querySelector(".h-16")).toBeNull();
  });
});
