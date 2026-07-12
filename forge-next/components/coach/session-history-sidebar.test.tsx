import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionHistorySidebar } from "@/components/coach/session-history-sidebar";
import { SessionNavigationProvider } from "@/lib/chat/session-navigation-context";

const mockListTaskSessions = vi.fn();

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/coach",
}));

function renderSidebar(props: React.ComponentProps<typeof SessionHistorySidebar>) {
  return render(
    <SessionNavigationProvider>
      <SessionHistorySidebar {...props} />
    </SessionNavigationProvider>,
  );
}

describe("SessionHistorySidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListTaskSessions.mockResolvedValue({ ok: true, sessions: [] });
  });

  it("hides history when collapsed", () => {
    renderSidebar({
      collapsed: true,
      expanded: false,
      onExpand: vi.fn(),
    });

    expect(
      screen.getByLabelText("Conversation history", { hidden: true }),
    ).toHaveClass("hidden");
  });

  it("shows loading state while sessions load", () => {
    mockListTaskSessions.mockReturnValue(new Promise(() => {}));

    renderSidebar({
      collapsed: false,
      expanded: false,
      onExpand: vi.fn(),
    });

    expect(screen.getByLabelText("Loading conversations")).toBeInTheDocument();
  });

  it("shows empty state when there are no sessions", async () => {
    mockListTaskSessions.mockResolvedValue({ ok: true, sessions: [] });

    renderSidebar({
      collapsed: false,
      expanded: false,
      onExpand: vi.fn(),
    });

    expect(await screen.findByText("No conversations yet")).toBeInTheDocument();
  });

  it("shows error state with retry", async () => {
    mockListTaskSessions.mockResolvedValue({
      ok: false,
      message: "Could not load conversations.",
    });

    renderSidebar({
      collapsed: false,
      expanded: false,
      onExpand: vi.fn(),
    });

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

    renderSidebar({
      collapsed: false,
      expanded: false,
      onExpand,
    });

    expect(await screen.findByText("Conversation 1")).toBeInTheDocument();
    expect(screen.getByText("Conversation 5")).toBeInTheDocument();
    expect(screen.queryByText("Conversation 6")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Show more conversations" }),
    );

    expect(onExpand).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("Conversation 6")).toBeInTheDocument();
    });
  });
});
