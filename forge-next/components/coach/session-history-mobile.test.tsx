import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionHistoryMobilePanel } from "@/components/coach/session-history-mobile-panel";
import { SessionHistoryMobileToggle } from "@/components/coach/session-history-mobile";

const mockListTaskSessions = vi.fn();
const mockPush = vi.fn();

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("SessionHistoryMobileToggle", () => {
  it("toggles pressed state", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<SessionHistoryMobileToggle open={false} onToggle={onToggle} />);

    await user.click(screen.getByRole("button", { name: "Conversation history" }));

    expect(onToggle).toHaveBeenCalled();
  });
});

describe("SessionHistoryMobilePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTaskSessions.mockResolvedValue({
      ok: true,
      sessions: [
        {
          id: "session-1",
          title: "Adjust weekly volume",
          updatedAt: "2026-06-21T00:00:00.000Z",
        },
      ],
    });
  });

  it("renders the inline session list with fade rows", async () => {
    render(<SessionHistoryMobilePanel onClose={vi.fn()} />);

    const row = await screen.findByText("Adjust weekly volume");
    expect(row).toBeInTheDocument();
    expect(row.closest("li")).toHaveClass("animate-fade-in");
  });

  it("shows loading state inline", () => {
    mockListTaskSessions.mockReturnValue(new Promise(() => {}));

    render(<SessionHistoryMobilePanel onClose={vi.fn()} />);

    expect(screen.getByLabelText("Loading conversations")).toBeInTheDocument();
  });

  it("closes history and navigates when a conversation is opened", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<SessionHistoryMobilePanel onClose={onClose} />);

    await user.click(await screen.findByText("Adjust weekly volume"));

    expect(mockPush).toHaveBeenCalledWith("/coach?sessionId=session-1");
    expect(onClose).toHaveBeenCalled();
  });
});
