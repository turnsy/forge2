import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionHistoryList } from "@/components/coach/session-history-list";

const mockListTaskSessions = vi.fn();
const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockStartSessionNavigation = vi.fn();

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
}));

vi.mock("@/lib/chat/session-navigation-context", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/chat/session-navigation-context")
  >("@/lib/chat/session-navigation-context");

  return {
    ...actual,
    useOptionalSessionNavigation: () => ({
      pendingSessionId: null,
      insertedSessions: [
        {
          id: "session-new",
          title: "Just created",
          updatedAt: "2026-06-28T00:00:00.000Z",
        },
      ],
      startSessionNavigation: mockStartSessionNavigation,
      registerNewSession: vi.fn(),
    }),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams("sessionId=session-2"),
}));

describe("SessionHistoryList integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTaskSessions.mockResolvedValue({
      ok: true,
      sessions: [
        {
          id: "session-1",
          title: "Build a plan",
          updatedAt: "2026-06-21T00:00:00.000Z",
        },
        {
          id: "session-2",
          title: "Adjust volume",
          updatedAt: "2026-06-20T00:00:00.000Z",
        },
      ],
    });
  });

  it("loads sessions and navigates on row click", async () => {
    const user = userEvent.setup();

    render(<SessionHistoryList />);

    expect(await screen.findByText("Build a plan")).toBeInTheDocument();
    expect(mockListTaskSessions).toHaveBeenCalled();

    await user.click(screen.getByText("Build a plan"));

    expect(mockStartSessionNavigation).toHaveBeenCalledWith("session-1");
    expect(mockPush).toHaveBeenCalledWith("/coach?sessionId=session-1");
  });

  it("prepends inserted sessions ahead of fetched history", async () => {
    render(<SessionHistoryList />);

    const inserted = await screen.findByText("Just created");
    const fetched = await screen.findByText("Build a plan");

    expect(
      inserted.compareDocumentPosition(fetched) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("preserves server-provided updatedAt order", async () => {
    mockListTaskSessions.mockResolvedValue({
      ok: true,
      sessions: [
        {
          id: "session-1",
          title: "Newer conversation",
          updatedAt: "2026-06-21T00:00:00.000Z",
        },
        {
          id: "session-2",
          title: "Older conversation",
          updatedAt: "2026-06-20T00:00:00.000Z",
        },
      ],
    });

    render(<SessionHistoryList />);

    const titles = await screen.findAllByText(/conversation$/i);
    expect(titles.map((node) => node.textContent)).toEqual([
      "Newer conversation",
      "Older conversation",
    ]);
  });
});
