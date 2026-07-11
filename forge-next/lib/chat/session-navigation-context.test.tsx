import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SessionNavigationProvider,
  useSessionNavigation,
} from "@/lib/chat/session-navigation-context";

const mockListTaskSessions = vi.fn();
const mockSearchParams = vi.fn(() => new URLSearchParams());
const mockPathname = vi.fn(() => "/coach");

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
  usePathname: () => mockPathname(),
}));

function Probe() {
  const {
    pendingSessionId,
    sessions,
    sessionsLoading,
    startSessionNavigation,
    registerNewSession,
    removeSession,
    updateSession,
  } = useSessionNavigation();

  return (
    <div>
      <span data-testid="pending">{pendingSessionId ?? "idle"}</span>
      <span data-testid="loading">{sessionsLoading ? "loading" : "ready"}</span>
      <span data-testid="session-count">{sessions.length}</span>
      <span data-testid="first-title">{sessions[0]?.title ?? "none"}</span>
      <button type="button" onClick={() => startSessionNavigation("session-1")}>
        Navigate
      </button>
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
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockPathname.mockReturnValue("/coach");
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

  it("loads sessions on mount", async () => {
    render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("session-count")).toHaveTextContent("1");
    });
    expect(mockListTaskSessions).toHaveBeenCalled();
  });

  it("clears pending navigation when the session id appears in the URL", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });

    await user.click(screen.getByRole("button", { name: "Navigate" }));
    expect(screen.getByTestId("pending")).toHaveTextContent("session-1");

    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-1"));
    rerender(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pending")).toHaveTextContent("idle");
    });
  });

  it("clears pending first-send navigation when leaving the coach workspace", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
    });

    await user.click(screen.getByRole("button", { name: "Navigate" }));
    expect(screen.getByTestId("pending")).toHaveTextContent("session-1");

    mockPathname.mockReturnValue("/coach/plans");
    rerender(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("pending")).toHaveTextContent("idle");
    });
  });

  it("inserts a new session without starting pending navigation", async () => {
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
    expect(screen.getByTestId("pending")).toHaveTextContent("idle");
  });

  it("does not re-insert an existing session id", async () => {
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
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(screen.getByTestId("session-count")).toHaveTextContent("2");
  });

  it("removes a session from both fetched and inserted lists", async () => {
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
    expect(screen.getByTestId("session-count")).toHaveTextContent("2");

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.getByTestId("session-count")).toHaveTextContent("1");
    expect(screen.getByTestId("first-title")).toHaveTextContent("Fresh thread");
  });

  it("updates a session title in the merged list", async () => {
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
