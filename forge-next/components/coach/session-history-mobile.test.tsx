import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionHistoryMobile } from "@/components/coach/session-history-mobile";

const mockListTaskSessions = vi.fn();

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("SessionHistoryMobile", () => {
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

  it("opens the history modal from the History button", async () => {
    const user = userEvent.setup();

    render(<SessionHistoryMobile />);

    await user.click(screen.getByRole("button", { name: "Conversation history" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      await screen.findByText("Adjust weekly volume"),
    ).toBeInTheDocument();
  });

  it("shows loading state in the modal", async () => {
    const user = userEvent.setup();
    mockListTaskSessions.mockReturnValue(new Promise(() => {}));

    render(<SessionHistoryMobile />);

    await user.click(screen.getByRole("button", { name: "Conversation history" }));

    expect(screen.getByLabelText("Loading conversations")).toBeInTheDocument();
  });

  it("shows empty state in the modal", async () => {
    const user = userEvent.setup();
    mockListTaskSessions.mockResolvedValue({ ok: true, sessions: [] });

    render(<SessionHistoryMobile />);

    await user.click(screen.getByRole("button", { name: "Conversation history" }));

    expect(await screen.findByText("No conversations yet")).toBeInTheDocument();
  });
});
