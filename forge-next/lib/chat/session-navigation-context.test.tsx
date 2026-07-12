import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SessionNavigationProvider,
  useSessionNavigation,
} from "@/lib/chat/session-navigation-context";

const mockListTaskSessions = vi.fn();

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

function Probe() {
  const { sessions, sessionsLoading, registerNewSession, removeSession, updateSession } =
    useSessionNavigation();

  return (
    <div>
      <span data-testid="loading">{sessionsLoading ? "loading" : "ready"}</span>
      <span data-testid="session-count">{sessions.length}</span>
      <span data-testid="first-title">{sessions[0]?.title ?? "none"}</span>
      <button
        type="button"
        onClick={() =>
          registerNewSession({
            id: "session-new",
            title: "Fresh thread",
            updatedAt: "2026-06-28T00:00:00.000Z",
          })
        }
      >
        Register
      </button>
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

  it("prepends a newly saved session optimistically", async () => {
    const user = userEvent.setup();

    render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });

    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(screen.getByTestId("session-count")).toHaveTextContent("2");
    expect(screen.getByTestId("first-title")).toHaveTextContent("Fresh thread");
    expect(mockListTaskSessions).toHaveBeenCalledTimes(1);
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

    await user.click(screen.getByRole("button", { name: "Register" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.getByTestId("session-count")).toHaveTextContent("1");
    expect(screen.getByTestId("first-title")).toHaveTextContent("Fresh thread");
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
