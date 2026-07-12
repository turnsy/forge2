import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionHistoryList } from "@/components/coach/session-history-list";
import { SessionNavigationProvider } from "@/lib/chat/session-navigation-context";

const mockListTaskSessions = vi.fn();
const mockDeleteTaskSession = vi.fn();
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
  deleteTaskSession: (...args: unknown[]) => mockDeleteTaskSession(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, refresh: mockRefresh }),
  useSearchParams: () => mockSearchParams(),
  usePathname: () => "/coach",
}));

function renderList() {
  return render(
    <SessionNavigationProvider>
      <SessionHistoryList />
    </SessionNavigationProvider>,
  );
}

describe("SessionHistoryList integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockDeleteTaskSession.mockResolvedValue({ ok: true });
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

    renderList();

    expect(await screen.findByText("Build a plan")).toBeInTheDocument();
    expect(mockListTaskSessions).toHaveBeenCalled();

    await user.click(screen.getByText("Build a plan"));

    expect(mockPush).toHaveBeenCalledWith("/coach?sessionId=session-1");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("highlights the active session from the URL param", async () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-1"));

    renderList();

    await waitFor(() => {
      expect(
        screen.getByText("Build a plan").closest("[aria-current='true']"),
      ).toBeTruthy();
    });
  });

  it("removes a deleted session from the list", async () => {
    const user = userEvent.setup();

    renderList();

    await screen.findByText("Build a plan");

    await user.click(screen.getAllByLabelText("Conversation actions")[0]);
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Build a plan")).not.toBeInTheDocument();
    });
    expect(mockDeleteTaskSession).toHaveBeenCalledWith("session-1");
  });

  it("redirects home when deleting the active session", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-1"));

    renderList();

    await screen.findByText("Build a plan");

    await user.click(screen.getAllByLabelText("Conversation actions")[0]);
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Build a plan")).not.toBeInTheDocument();
    });
    expect(mockReplace).toHaveBeenCalledWith("/coach");
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
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

    renderList();

    const titles = await screen.findAllByText(/conversation$/i);
    expect(titles.map((node) => node.textContent)).toEqual([
      "Newer conversation",
      "Older conversation",
    ]);
  });
});
