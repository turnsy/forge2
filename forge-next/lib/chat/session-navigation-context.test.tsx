import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SessionNavigationProvider,
  useSessionNavigation,
} from "@/lib/chat/session-navigation-context";

const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
}));

function Probe() {
  const {
    pendingSessionId,
    activeSessionId,
    startSessionNavigation,
    clearActiveSession,
  } = useSessionNavigation();

  return (
    <div>
      <span data-testid="pending">{pendingSessionId ?? "idle"}</span>
      <span data-testid="active">{activeSessionId ?? "none"}</span>
      <button type="button" onClick={() => startSessionNavigation("session-1")}>
        Navigate
      </button>
      <button type="button" onClick={clearActiveSession}>
        Clear
      </button>
    </div>
  );
}

describe("SessionNavigationProvider", () => {
  beforeEach(() => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
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
    expect(screen.getByTestId("active")).toHaveTextContent("session-1");

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

  it("keeps the sidebar cleared after reset when the URL is still stale", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-1"));

    render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    expect(screen.getByTestId("active")).toHaveTextContent("session-1");

    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByTestId("active")).toHaveTextContent("none");
  });
});
