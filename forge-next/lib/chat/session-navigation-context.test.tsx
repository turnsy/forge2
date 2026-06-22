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
  const { pendingSessionId, startSessionNavigation } = useSessionNavigation();

  return (
    <div>
      <span>{pendingSessionId ?? "idle"}</span>
      <button type="button" onClick={() => startSessionNavigation("session-1")}>
        Navigate
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
    expect(screen.getByText("session-1")).toBeInTheDocument();

    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-1"));
    rerender(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("idle")).toBeInTheDocument();
    });
  });
});
