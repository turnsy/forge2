import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SessionNavigationProvider,
  useSessionNavigation,
} from "@/lib/chat/session-navigation-context";

const mockSearchParams = vi.fn(() => new URLSearchParams());
const mockPathname = vi.fn(() => "/coach");

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
  usePathname: () => mockPathname(),
}));

function Probe() {
  const {
    pendingSessionId,
    insertedSessions,
    startSessionNavigation,
    registerNewSession,
  } = useSessionNavigation();

  return (
    <div>
      <span data-testid="pending">{pendingSessionId ?? "idle"}</span>
      <span data-testid="inserted-count">{insertedSessions.length}</span>
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
    </div>
  );
}

describe("SessionNavigationProvider", () => {
  beforeEach(() => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockPathname.mockReturnValue("/coach");
  });

  it("clears pending navigation when the session id appears in the URL", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

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

    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(screen.getByTestId("inserted-count")).toHaveTextContent("1");
    expect(screen.getByTestId("pending")).toHaveTextContent("idle");
  });

  it("does not re-insert an existing session id", async () => {
    const user = userEvent.setup();

    render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Register" }));
    await user.click(screen.getByRole("button", { name: "Register" }));

    expect(screen.getByTestId("inserted-count")).toHaveTextContent("1");
  });
});
