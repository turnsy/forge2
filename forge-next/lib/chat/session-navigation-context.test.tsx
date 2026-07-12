import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SessionNavigationProvider,
  useSessionNavigation,
} from "@/lib/chat/session-navigation-context";

const mockListTaskSessions = vi.fn();
const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
}));

function Probe() {
  const { sessions, sessionsLoading, removeSession, updateSession } =
    useSessionNavigation();

  return (
    <div>
      <span data-testid="loading">{sessionsLoading ? "loading" : "ready"}</span>
      <span data-testid="session-count">{sessions.length}</span>
      <span data-testid="first-title">{sessions[0]?.title ?? "none"}</span>
      <button type="button" onClick={() => removeSession("session-1")}>
        Remove
      </button>
      <button
        type="button"
        onClick={() => updateSession("session-1", { title: "Renamed" })}
      >
        Rename
      </button>
    </div>
  );
}

describe("SessionNavigationProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockListTaskSessions.mockResolvedValue({
      ok: true,
      sessions: [
        {
          id: "session-1",
          title: "Build a plan",
          updatedAt: "2026-06-21T00:00:00.000Z",
        },
      ],
    });
  });

  it("loads sessions once on mount", async () => {
    render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("session-count")).toHaveTextContent("1");
    });
    expect(mockListTaskSessions).toHaveBeenCalledTimes(1);
  });

  it("refetches when the session id URL param changes", async () => {
    const { rerender } = render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });

    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-2"));
    rerender(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(mockListTaskSessions).toHaveBeenCalledTimes(2);
    });
  });

  it("removes a session from the list", async () => {
    const user = userEvent.setup();

    render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("session-count")).toHaveTextContent("1");
    });

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.getByTestId("session-count")).toHaveTextContent("0");
  });

  it("updates a session title in the list", async () => {
    const user = userEvent.setup();

    render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("first-title")).toHaveTextContent("Build a plan");
    });

    await user.click(screen.getByRole("button", { name: "Rename" }));

    expect(screen.getByTestId("first-title")).toHaveTextContent("Renamed");
  });
});
