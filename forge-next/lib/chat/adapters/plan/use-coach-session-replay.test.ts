/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockResolve } = vi.hoisted(() => ({
  mockResolve: vi.fn(),
}));

vi.mock("@/lib/chat/adapters/plan/resolve-session-events", () => ({
  resolveCoachSessionEvents: (...args: unknown[]) => mockResolve(...args),
}));

import { useCoachSessionReplay } from "@/lib/chat/adapters/plan/use-coach-session-replay";

describe("useCoachSessionReplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows persisted events immediately while reconciling with Eve", async () => {
    const mergedEvents = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "session.waiting", data: {} },
      { type: "message.received", data: { message: "Again" } },
      { type: "session.waiting", data: {} },
    ];

    mockResolve.mockResolvedValue(mergedEvents);

    const { result } = renderHook(() =>
      useCoachSessionReplay({
        id: "forge-1",
        snapshot: {
          title: "Test",
          forgeSessionId: "forge-1",
          eve: { sessionId: "eve-1", continuationToken: "token" },
          eveEvents: mergedEvents.slice(0, 2),
        },
      }),
    );

    expect(result.current.status).toBe("ready");
    if (result.current.status === "ready") {
      expect(result.current.events).toEqual(mergedEvents.slice(0, 2));
    }

    await waitFor(() => {
      expect(result.current.status).toBe("ready");
      if (result.current.status === "ready") {
        expect(result.current.events).toEqual(mergedEvents);
      }
    });

    expect(mockResolve).toHaveBeenCalledOnce();
  });
});
