import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionHistorySidebar } from "@/components/coach/session-history-sidebar";

const mockListTaskSessions = vi.fn();

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("SessionHistorySidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when collapsed", () => {
    const { container } = render(
      <SessionHistorySidebar
        collapsed
        expanded={false}
        onExpand={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows loading state while sessions load", () => {
    mockListTaskSessions.mockReturnValue(new Promise(() => {}));

    render(
      <SessionHistorySidebar
        collapsed={false}
        expanded={false}
        onExpand={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Loading conversations")).toBeInTheDocument();
  });

  it("shows empty state when there are no sessions", async () => {
    mockListTaskSessions.mockResolvedValue({ ok: true, sessions: [] });

    render(
      <SessionHistorySidebar
        collapsed={false}
        expanded={false}
        onExpand={vi.fn()}
      />,
    );

    expect(await screen.findByText("No conversations yet")).toBeInTheDocument();
  });

  it("shows error state with retry", async () => {
    mockListTaskSessions.mockResolvedValue({
      ok: false,
      message: "Could not load conversations.",
    });

    render(
      <SessionHistorySidebar
        collapsed={false}
        expanded={false}
        onExpand={vi.fn()}
      />,
    );

    expect(
      await screen.findByText("Could not load conversations."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("renders sessions and show more expands the list", async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    mockListTaskSessions.mockResolvedValue({
      ok: true,
      sessions: Array.from({ length: 6 }, (_, index) => ({
        id: `session-${index + 1}`,
        title: `Conversation ${index + 1}`,
        updatedAt: "2026-06-21T00:00:00.000Z",
      })),
    });

    render(
      <SessionHistorySidebar
        collapsed={false}
        expanded={false}
        onExpand={onExpand}
      />,
    );

    expect(await screen.findByText("Conversation 1")).toBeInTheDocument();
    expect(screen.getByText("Conversation 5")).toBeInTheDocument();
    expect(screen.queryByText("Conversation 6")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Show more/i }));

    expect(onExpand).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("Conversation 6")).toBeInTheDocument();
    });
  });
});
