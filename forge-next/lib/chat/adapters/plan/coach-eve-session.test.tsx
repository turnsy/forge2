import { renderHook, waitFor } from "@testing-library/react";
import type { HandleMessageStreamEvent } from "eve/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { restoreEveSessionEvents } from "@/lib/chat/adapters/plan/replay-eve-session";
import {
  applyCoachEveLoadPhase,
  applyUserStoppedTurn,
  useCoachEveCatchUp,
} from "@/lib/chat/adapters/plan/coach-eve-session";
import { createEveCoachReducer } from "@/lib/chat/adapters/plan/eve-coach-reducer";
import { STREAM_INTERRUPTED_MESSAGE } from "@/lib/chat/stream-completion";
import type { CoachWorkspaceSnapshot } from "@/lib/chat/session-types";

vi.mock("@/lib/chat/adapters/plan/replay-eve-session", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/chat/adapters/plan/replay-eve-session")
  >();
  return {
    ...actual,
    restoreEveSessionEvents: vi.fn(),
  };
});

const mockRestoreEveSessionEvents = vi.mocked(restoreEveSessionEvents);

const persistedEvent = {
  type: "message.received",
  data: { message: "Hello" },
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
    mockRestoreEveSessionEvents.mockResolvedValue([
      persistedEvent,
      turnBoundary,
    ]);
  });

  it("returns idle when no session is provided", () => {
    const { result } = renderHook(() => useCoachEveCatchUp());

    expect(result.current).toEqual({
      loadPhase: "idle",
      events: [],
    });
    expect(mockRestoreEveSessionEvents).not.toHaveBeenCalled();
  });

  it("returns ready immediately for persisted-only snapshots", () => {
    const session = createSession("session-1", {
      eveEvents: [persistedEvent],
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    expect(result.current).toEqual({
      loadPhase: "ready",
      events: [persistedEvent],
    });
    expect(mockRestoreEveSessionEvents).not.toHaveBeenCalled();
  });

  it("shows loading until Eve hydration completes", async () => {
    const syncedEvents = [persistedEvent, turnBoundary];
    mockRestoreEveSessionEvents.mockResolvedValue(syncedEvents);

    const session = createSession("session-2", {
      eve: {
        sessionId: "eve-session-2",
        continuationToken: "token-2",
        streamIndex: 0,
      },
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    expect(result.current).toEqual({
      loadPhase: "loading",
      events: [],
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        loadPhase: "ready",
        events: syncedEvents,
      });
    });
  });

  it("does not expose cached events while loading from Eve", async () => {
    const syncedEvents = [persistedEvent, turnBoundary];
    mockRestoreEveSessionEvents.mockResolvedValue(syncedEvents);

    const session = createSession("session-1", {
      eve: evePointer,
      eveEvents: [persistedEvent],
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    expect(result.current).toEqual({
      loadPhase: "loading",
      events: [],
    });

    await waitFor(() => {
      expect(result.current).toEqual({
        loadPhase: "ready",
        events: syncedEvents,
      });
    });
  });

  it("marks waiting when Eve tail finishes without a turn boundary", async () => {
    const inFlightCheckpoint = [
      persistedEvent,
      {
        type: "turn.started",
        data: { turnId: "turn-1", sequence: 1 },
      },
    ] as HandleMessageStreamEvent[];

    mockRestoreEveSessionEvents.mockResolvedValue(inFlightCheckpoint);

    const session = createSession("session-stale", {
      eve: evePointer,
      eveEvents: inFlightCheckpoint,
    });

    const { result } = renderHook(() => useCoachEveCatchUp(session));

    await waitFor(() => {
      expect(result.current).toEqual({
        loadPhase: "waiting",
        events: inFlightCheckpoint,
      });
    });
  });
});

describe("applyCoachEveLoadPhase", () => {
  const reducer = createEveCoachReducer();

  it("clears stale generating state after an interrupted load", () => {
    let state = reducer.initial();
    state = reducer.reduce(state, {
      type: "turn.started",
      data: { turnId: "turn-1", sequence: 1 },
    });

    const normalized = applyCoachEveLoadPhase("interrupted", state);

    expect(normalized.runStatus).toBeNull();
    expect(normalized.phase).toBe("idle");
    expect(normalized.errors).toEqual([
      { message: STREAM_INTERRUPTED_MESSAGE },
    ]);
  });

  it("clears generating state without an error when the user stops", () => {
    let state = reducer.initial();
    state = reducer.reduce(state, {
      type: "turn.started",
      data: { turnId: "turn-1", sequence: 1 },
    });
    state = {
      ...state,
      errors: [{ message: "The operation was aborted." }],
    };

    const normalized = applyUserStoppedTurn(state);

    expect(normalized.runStatus).toBeNull();
    expect(normalized.phase).toBe("idle");
    expect(normalized.errors).toEqual([]);
  });

  it("clears late abort failures emitted after stop()", () => {
    let state = reducer.initial();
    state = reducer.reduce(state, {
      type: "client.message.submitted",
      data: {
        createdAt: Date.now(),
        message: "Build a plan",
        submissionId: "sub-1",
      },
    });
    state = reducer.reduce(state, {
      type: "client.message.failed",
      data: {
        createdAt: Date.now(),
        error: { message: "fetch is aborted" },
        message: "Build a plan",
        submissionId: "sub-1",
      },
    });

    const normalized = applyUserStoppedTurn(state);

    expect(normalized.runStatus).toBeNull();
    expect(normalized.phase).toBe("idle");
    expect(normalized.errors).toEqual([]);
  });

  it("leaves in-flight projection untouched while waiting", () => {
    let state = reducer.initial();
    state = reducer.reduce(state, {
      type: "turn.started",
      data: { turnId: "turn-1", sequence: 1 },
    });

    const normalized = applyCoachEveLoadPhase("waiting", state);

    expect(normalized.runStatus).toBe("generating");
    expect(normalized.phase).toBe("streaming");
    expect(normalized.errors).toEqual([]);
  });
});
