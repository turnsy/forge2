import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("prefers the router session id over a stale window value", () => {
    window.history.replaceState(null, "", "/coach?sessionId=session-a");
    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-b"));

    render(<SessionIdProbe />);

    expect(screen.getByTestId("session-id")).toHaveTextContent("session-b");
  });

  it("falls back to the window session id after replaceState", () => {
    window.history.replaceState(null, "", "/coach?sessionId=session-a");

    render(<SessionIdProbe />);

    expect(screen.getByTestId("session-id")).toHaveTextContent("session-a");
  });
});
