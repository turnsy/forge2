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

  it("reads the session id from the current window URL", () => {
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
});
