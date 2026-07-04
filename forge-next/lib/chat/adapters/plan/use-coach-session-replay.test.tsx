import { renderHook, waitFor } from "@testing-library/react";
import type { HandleMessageStreamEvent } from "eve/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { restoreEveSessionEvents } from "@/lib/chat/adapters/plan/replay-eve-session";
import { useCoachSessionReplay } from "@/lib/chat/adapters/plan/use-coach-session-replay";
import type { CoachWorkspaceSnapshot } from "@/lib/chat/session-types";

vi.mock("@/lib/chat/adapters/plan/replay-eve-session", () => ({
  restoreEveSessionEvents: vi.fn(),
}));

const mockRestoreEveSessionEvents = vi.mocked(restoreEveSessionEvents);

const persistedEvent = {
  type: "message.received",
  data: { message: { role: "user", content: "Hello" } },
} as HandleMessageStreamEvent;

const otherPersistedEvent = {
  type: "message.received",
  data: { message: { role: "user", content: "Follow up" } },
} as HandleMessageStreamEvent;

function createSession(
  id: string,
  snapshot: Partial<CoachWorkspaceSnapshot> = {},
) {
  return {
    id,
    snapshot: {
      title: null,
      forgeSessionId: id,
      eve: null,
      ...snapshot,
    },
  };
}

describe("useCoachSessionReplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRestoreEveSessionEvents.mockResolvedValue([persistedEvent]);
  });

  it("returns ready immediately when eveEvents are persisted", () => {
    const session = createSession("session-1", {
      eveEvents: [persistedEvent],
    });

    const { result } = renderHook(() => useCoachSessionReplay(session));

    expect(result.current).toEqual({
      status: "ready",
      events: [persistedEvent],
    });
    expect(mockRestoreEveSessionEvents).not.toHaveBeenCalled();
  });

  it("loads events from the network when only an Eve pointer exists", async () => {
    const replayedEvents = [otherPersistedEvent];
    mockRestoreEveSessionEvents.mockResolvedValue(replayedEvents);

    const session = createSession("session-2", {
      eve: {
        sessionId: "eve-session-2",
        continuationToken: "token-2",
        streamIndex: 0,
      },
    });

    const { result } = renderHook(
      ({ session: activeSession }) => useCoachSessionReplay(activeSession),
      { initialProps: { session } },
    );

    expect(result.current).toEqual({ status: "loading" });

    await waitFor(() => {
      expect(result.current).toEqual({
        status: "ready",
        events: replayedEvents,
      });
    });

    expect(mockRestoreEveSessionEvents).toHaveBeenCalledWith(
      {
        sessionId: "eve-session-2",
        continuationToken: "token-2",
        streamIndex: 0,
      },
      "session-2",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("clears stale events when the replay key changes", async () => {
    const firstSession = createSession("session-a", {
      eveEvents: [persistedEvent],
    });
    const secondSession = createSession("session-b", {
      eveEvents: [otherPersistedEvent],
    });

    const { result, rerender } = renderHook(
      ({ session }) => useCoachSessionReplay(session),
      { initialProps: { session: firstSession } },
    );

    expect(result.current).toEqual({
      status: "ready",
      events: [persistedEvent],
    });

    rerender({ session: secondSession });

    await waitFor(() => {
      expect(result.current).toEqual({
        status: "ready",
        events: [otherPersistedEvent],
      });
    });
  });
});
