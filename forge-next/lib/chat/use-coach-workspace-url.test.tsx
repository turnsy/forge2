import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COACH_WORKSPACE_URL_CHANGE_EVENT } from "@/lib/chat/session-url";
import { useCoachWorkspaceSessionId } from "@/lib/chat/use-coach-workspace-url";

const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams(),
}));

function SessionIdProbe() {
  const sessionId = useCoachWorkspaceSessionId();
  return <span data-testid="session-id">{sessionId ?? "none"}</span>;
}

describe("useCoachWorkspaceSessionId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams());
    window.history.replaceState(null, "", "/coach");
  });

  it("prefers router search params for sidebar navigation", () => {
    window.history.replaceState(null, "", "/coach?sessionId=session-a");
    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-b"));

    render(<SessionIdProbe />);

    expect(screen.getByTestId("session-id")).toHaveTextContent("session-b");
  });

  it("falls back to the window URL for replaceState new-thread sync", () => {
    window.history.replaceState(null, "", "/coach?sessionId=session-a");

    render(<SessionIdProbe />);

    expect(screen.getByTestId("session-id")).toHaveTextContent("session-a");
  });

  it("re-renders when replaceState updates the URL", async () => {
    render(<SessionIdProbe />);
    expect(screen.getByTestId("session-id")).toHaveTextContent("none");

    window.history.replaceState(null, "", "/coach?sessionId=session-a");
    window.dispatchEvent(new Event(COACH_WORKSPACE_URL_CHANGE_EVENT));

    await waitFor(() => {
      expect(screen.getByTestId("session-id")).toHaveTextContent("session-a");
    });
  });

  it("clears the active session when router returns home", () => {
    window.history.replaceState(null, "", "/coach");
    mockSearchParams.mockReturnValue(new URLSearchParams());

    render(<SessionIdProbe />);

    expect(screen.getByTestId("session-id")).toHaveTextContent("none");
  });
});
