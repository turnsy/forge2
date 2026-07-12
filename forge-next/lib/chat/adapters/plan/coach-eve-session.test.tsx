import { renderHook, waitFor } from "@testing-library/react";
import type { HandleMessageStreamEvent } from "eve/client";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  restoreEveSessionEvents,
  tailEveSessionEvents,
} from "@/lib/chat/adapters/plan/replay-eve-session";
import { useCoachEveCatchUp } from "@/lib/chat/adapters/plan/coach-eve-session";
import type { CoachWorkspaceSnapshot } from "@/lib/chat/session-types";

vi.mock("@/lib/chat/adapters/plan/replay-eve-session", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/chat/adapters/plan/replay-eve-session")
  >();
  return {
    ...actual,
    restoreEveSessionEvents: vi.fn(),
    tailEveSessionEvents: vi.fn(),
  };
});

const mockRestore = vi.mocked(restoreEveSessionEvents);
const mockTail = vi.mocked(tailEveSessionEvents);

const persistedEvent = {
  type: "message.received",
  data: { message: "Hello" },
} as HandleMessageStreamEvent;

const midTurnEvent = {
  type: "turn.started",
  data: { turnId: "turn-1", sequence: 1 },
} as HandleMessageStreamEvent;

const turnBoundary = {
  type: "session.waiting",
  data: {},
} as HandleMessageStreamEvent;

const evePointer = {
  sessionId: "eve-session-1",
  continuationToken: "token-1",
  streamIndex: 1,
};

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

describe("useCoachEveCatchUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRestore.mockResolvedValue({
      events: [persistedEvent, turnBoundary],
      needsLiveTail: false,
      markerApplies: false,
    });
    mockTail.mockResolvedValue({ events: [], completed: false });
  });

  it("returns idle when no session is provided", () => {
    const { result } = renderHook(() => useCoachEveCatchUp());

    expect(result.current.loadPhase).toBe("idle");
    expect(result.current.events).toEqual([]);
    expect(result.current.finalizeReason).toBeNull();
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("returns ready immediately for persisted-only snapshots", () => {
    const session = createSession("session-1", {
      eveEvents: [persistedEvent, turnBoundary],
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    expect(result.current.loadPhase).toBe("ready");
    expect(result.current.events).toEqual([persistedEvent, turnBoundary]);
    expect(result.current.finalizeReason).toBeNull();
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("shows loading until Eve reconciliation completes", async () => {
    const session = createSession("session-2", {
      eve: evePointer,
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    expect(result.current.loadPhase).toBe("loading");
    expect(result.current.events).toEqual([]);

    await waitFor(() => {
      expect(result.current.loadPhase).toBe("ready");
    });
    expect(result.current.events).toEqual([persistedEvent, turnBoundary]);
    expect(result.current.finalizeReason).toBeNull();
  });

  it("settles a marker-annotated log as restored without waiting", async () => {
    mockRestore.mockResolvedValue({
      events: [persistedEvent, midTurnEvent],
      needsLiveTail: false,
      markerApplies: true,
    });

    const session = createSession("session-stopped", {
      eve: evePointer,
      eveEvents: [persistedEvent, midTurnEvent],
      lastTurn: { status: "stopped", eventCount: 2 },
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    await waitFor(() => {
      expect(result.current.loadPhase).toBe("ready");
    });
    expect(result.current.finalizeReason).toBe("restored");
    expect(mockTail).not.toHaveBeenCalled();
  });

  it("tails a live turn and settles ready when the boundary arrives", async () => {
    mockRestore.mockResolvedValue({
      events: [persistedEvent, midTurnEvent],
      needsLiveTail: true,
      markerApplies: false,
    });

    let emitEvent: ((event: HandleMessageStreamEvent) => void) | null = null;
    let finishTail: ((result: { events: HandleMessageStreamEvent[]; completed: boolean }) => void) | null =
      null;

    mockTail.mockImplementation((_pointer, _forgeSessionId, options) => {
      emitEvent = options.onEvent ?? null;
      return new Promise((resolve) => {
        finishTail = resolve;
      });
    });

    const session = createSession("session-live", {
      eve: evePointer,
      eveEvents: [persistedEvent, midTurnEvent],
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    await waitFor(() => {
      expect(result.current.loadPhase).toBe("resuming");
    });
    expect(result.current.events).toEqual([persistedEvent, midTurnEvent]);

    await act(async () => {
      emitEvent?.(turnBoundary);
    });

    expect(result.current.events).toEqual([
      persistedEvent,
      midTurnEvent,
      turnBoundary,
    ]);

    await act(async () => {
      finishTail?.({ events: [turnBoundary], completed: true });
    });

    await waitFor(() => {
      expect(result.current.loadPhase).toBe("ready");
    });
    expect(result.current.finalizeReason).toBeNull();
    expect(mockTail).toHaveBeenCalledWith(
      evePointer,
      "session-live",
      expect.objectContaining({ startIndex: 2 }),
    );
  });

  it("finalizes a dead turn as interrupted when the tail goes quiet", async () => {
    mockRestore.mockResolvedValue({
      events: [persistedEvent, midTurnEvent],
      needsLiveTail: true,
      markerApplies: false,
    });
    mockTail.mockResolvedValue({ events: [], completed: false });

    const session = createSession("session-dead", {
      eve: evePointer,
      eveEvents: [persistedEvent, midTurnEvent],
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    await waitFor(() => {
      expect(result.current.loadPhase).toBe("ready");
    });
    expect(result.current.finalizeReason).toBe("interrupted");
    expect(result.current.events).toEqual([persistedEvent, midTurnEvent]);
  });

  it("finalizes as stopped when the user stops the live tail", async () => {
    mockRestore.mockResolvedValue({
      events: [persistedEvent, midTurnEvent],
      needsLiveTail: true,
      markerApplies: false,
    });

    let resolveTail:
      | ((result: { events: HandleMessageStreamEvent[]; completed: boolean }) => void)
      | null = null;
    let tailSignal: AbortSignal | undefined;

    mockTail.mockImplementation((_pointer, _forgeSessionId, options) => {
      tailSignal = options.signal;
      return new Promise((resolve) => {
        resolveTail = resolve;
      });
    });

    const session = createSession("session-stop", {
      eve: evePointer,
      eveEvents: [persistedEvent, midTurnEvent],
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    await waitFor(() => {
      expect(result.current.loadPhase).toBe("resuming");
    });

    await act(async () => {
      result.current.stopResuming();
      // The real tail resolves once its signal aborts.
      expect(tailSignal?.aborted).toBe(true);
      resolveTail?.({ events: [], completed: false });
    });

    await waitFor(() => {
      expect(result.current.loadPhase).toBe("ready");
    });
    expect(result.current.finalizeReason).toBe("stopped");
  });

  it("falls back to cached events when reconciliation fails", async () => {
    mockRestore.mockRejectedValue(new Error("network down"));

    const session = createSession("session-offline", {
      eve: evePointer,
      eveEvents: [persistedEvent, turnBoundary],
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    await waitFor(() => {
      expect(result.current.loadPhase).toBe("ready");
    });
    expect(result.current.events).toEqual([persistedEvent, turnBoundary]);
    expect(result.current.finalizeReason).toBeNull();
  });

  it("finalizes cached mid-turn events as restored when reconciliation fails", async () => {
    mockRestore.mockRejectedValue(new Error("network down"));

    const session = createSession("session-offline-mid", {
      eve: evePointer,
      eveEvents: [persistedEvent, midTurnEvent],
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    await waitFor(() => {
      expect(result.current.loadPhase).toBe("ready");
    });
    expect(result.current.events).toEqual([persistedEvent, midTurnEvent]);
    expect(result.current.finalizeReason).toBe("restored");
  });

  it("errors when nothing can be restored", async () => {
    mockRestore.mockRejectedValue(new Error("network down"));

    const session = createSession("session-broken", {
      eve: evePointer,
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    await waitFor(() => {
      expect(result.current.loadPhase).toBe("error");
    });
    expect(result.current.errorMessage).toBe("Couldn't load conversation.");
  });
});
