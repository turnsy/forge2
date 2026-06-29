import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
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
    insertedSessions,
    startSessionNavigation,
    registerNewSession,
    stashPendingFirstSend,
    consumePendingFirstSend,
  } = useSessionNavigation();
  const [consumedMessage, setConsumedMessage] = useState<string | null>(null);

  return (
    <div>
      <span data-testid="pending">{pendingSessionId ?? "idle"}</span>
      <span data-testid="inserted-count">{insertedSessions.length}</span>
      <span data-testid="consumed">{consumedMessage ?? "none"}</span>
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
      <button
        type="button"
        onClick={() =>
          stashPendingFirstSend({
            sessionId: "session-new",
            message: "Hello there",
          })
        }
      >
        Stash
      </button>
      <button
        type="button"
        onClick={() =>
          setConsumedMessage(
            consumePendingFirstSend("session-new")?.message ?? "none",
          )
        }
      >
        Consume
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

  it("stashes and consumes a pending first send", async () => {
    const user = userEvent.setup();

    render(
      <SessionNavigationProvider>
        <Probe />
      </SessionNavigationProvider>,
    );

    expect(screen.getByTestId("consumed")).toHaveTextContent("none");

    await user.click(screen.getByRole("button", { name: "Stash" }));
    await user.click(screen.getByRole("button", { name: "Consume" }));

    expect(screen.getByTestId("consumed")).toHaveTextContent("Hello there");
  });
});
