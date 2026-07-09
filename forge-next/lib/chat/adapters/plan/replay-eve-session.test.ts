import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockStream, mockClient } = vi.hoisted(() => {
  const mockStream = vi.fn();
  const mockSession = vi.fn(() => ({ stream: mockStream }));
  const mockClient = vi.fn(() => ({ session: mockSession }));
  return { mockStream, mockClient };
});

vi.mock("eve/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("eve/client")>();
  return {
    ...actual,
    Client: mockClient,
    isCurrentTurnBoundaryEvent: (event: { type: string }) =>
      event.type === "session.waiting",
  };
});

import {
  restoreEveSessionEvents,
  tailEveSessionEvents,
} from "@/lib/chat/adapters/plan/replay-eve-session";

const evePointer = {
  sessionId: "eve-1",
  continuationToken: "token",
};

const QUIET = 800;
const CONNECT = 12_100;

function sleepUntilAbort(signal?: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (!signal || signal.aborted) {
      resolve();
      return;
    }

    signal.addEventListener("abort", () => resolve(), { once: true });
  });
}

/** Yields the given events immediately, then stays open until aborted. */
function streamOf(events: { type: string; data?: unknown }[]) {
  return async function* ({ signal }: { signal?: AbortSignal } = {}) {
    for (const event of events) {
      yield event;
    }

    await sleepUntilAbort(signal);
  };
}

describe("restoreEveSessionEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("replays a full session log in one pass without cached events", async () => {
    const log = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.completed", data: { message: "Hi there" } },
      { type: "session.waiting", data: {} },
      { type: "message.received", data: { message: "Again" } },
      { type: "message.completed", data: { message: "Sure" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream.mockImplementationOnce(streamOf(log));

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1");

    await vi.advanceTimersByTimeAsync(QUIET);

    await expect(promise).resolves.toEqual({
      events: log,
      needsLiveTail: false,
      markerApplies: false,
    });

    expect(mockStream).toHaveBeenCalledOnce();
    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 0,
      signal: expect.any(AbortSignal),
    });
  });

  it("confirms a caught-up cache via the echoed last event", async () => {
    const persisted = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.completed", data: { message: "Hi there" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream.mockImplementationOnce(streamOf([persisted[2]]));

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persisted,
    });

    await vi.advanceTimersByTimeAsync(QUIET);

    await expect(promise).resolves.toEqual({
      events: persisted,
      needsLiveTail: false,
      markerApplies: false,
    });

    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 2,
      signal: expect.any(AbortSignal),
    });
  });

  it("recovers turns the cache missed, even when the server is slow to respond", async () => {
    const persisted = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "session.waiting", data: {} },
    ];
    const missedTurn = [
      { type: "message.received", data: { message: "You missed me" } },
      { type: "message.completed", data: { message: "Recovered" } },
      { type: "session.waiting", data: {} },
    ];

    // First byte arrives after 5s (cold server) — well past any short probe
    // window, but within the connect budget.
    mockStream.mockImplementationOnce(async function* ({
      signal,
    }: {
      signal?: AbortSignal;
    } = {}) {
      await new Promise((resolve) => setTimeout(resolve, 5_000));
      yield persisted[1];
      for (const event of missedTurn) {
        yield event;
      }

      await sleepUntilAbort(signal);
    });

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persisted,
    });

    await vi.advanceTimersByTimeAsync(5_000 + QUIET);

    await expect(promise).resolves.toEqual({
      events: [...persisted, ...missedTurn],
      needsLiveTail: false,
      markerApplies: false,
    });
  });

  it("falls back to cached events when the server never responds", async () => {
    const persisted = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream.mockImplementationOnce(async function* ({
      signal,
    }: {
      signal?: AbortSignal;
    } = {}) {
      await sleepUntilAbort(signal);
    });

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persisted,
    });

    await vi.advanceTimersByTimeAsync(CONNECT);

    await expect(promise).resolves.toEqual({
      events: persisted,
      needsLiveTail: false,
      markerApplies: false,
    });
  });

  it("hands a mid-turn log without a marker to the live tail", async () => {
    const persisted = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "turn.started", data: { turnId: "turn-1", sequence: 1 } },
    ];

    mockStream.mockImplementationOnce(streamOf([persisted[1]]));

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persisted,
    });

    await vi.advanceTimersByTimeAsync(QUIET);

    await expect(promise).resolves.toEqual({
      events: persisted,
      needsLiveTail: true,
      markerApplies: false,
    });
  });

  it("keeps a marker-annotated mid-turn log settled when the server has nothing newer", async () => {
    const persisted = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "turn.started", data: { turnId: "turn-1", sequence: 1 } },
    ];

    mockStream.mockImplementationOnce(streamOf([persisted[1]]));

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persisted,
      lastTurn: { status: "stopped", eventCount: 2 },
    });

    await vi.advanceTimersByTimeAsync(QUIET);

    await expect(promise).resolves.toEqual({
      events: persisted,
      needsLiveTail: false,
      markerApplies: true,
    });
  });

  it("discards the marker when the server log advanced past it", async () => {
    const persisted = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "turn.started", data: { turnId: "turn-1", sequence: 1 } },
    ];
    const serverTail = [
      { type: "message.completed", data: { message: "Done after all" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream.mockImplementationOnce(streamOf([persisted[1], ...serverTail]));

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persisted,
      lastTurn: { status: "stopped", eventCount: 2 },
    });

    await vi.advanceTimersByTimeAsync(QUIET);

    await expect(promise).resolves.toEqual({
      events: [...persisted, ...serverTail],
      needsLiveTail: false,
      markerApplies: false,
    });
  });

  it("ignores a stale marker recorded for a different event count", async () => {
    const persisted = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "turn.started", data: { turnId: "turn-1", sequence: 1 } },
    ];

    mockStream.mockImplementationOnce(streamOf([persisted[1]]));

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persisted,
      lastTurn: { status: "stopped", eventCount: 1 },
    });

    await vi.advanceTimersByTimeAsync(QUIET);

    await expect(promise).resolves.toEqual({
      events: persisted,
      needsLiveTail: true,
      markerApplies: false,
    });
  });

  it("caps the reconcile window and defers a live turn to the tail", async () => {
    const persisted = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "session.waiting", data: {} },
    ];

    // A live turn streaming steadily with no quiet gaps.
    mockStream.mockImplementationOnce(async function* ({
      signal,
    }: {
      signal?: AbortSignal;
    } = {}) {
      yield persisted[1];
      yield { type: "message.received", data: { message: "New turn" } };

      for (let i = 0; i < 100 && !signal?.aborted; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        yield { type: "message.appended", data: { messageSoFar: `chunk ${i}` } };
      }
    });

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persisted,
    });

    await vi.advanceTimersByTimeAsync(10_000);

    const result = await promise;
    expect(result.needsLiveTail).toBe(true);
    expect(result.markerApplies).toBe(false);
    expect(result.events.length).toBeGreaterThan(persisted.length);
    // The window cap kept the load bounded instead of collecting all chunks.
    expect(result.events.length).toBeLessThan(30);
  });
});

describe("tailEveSessionEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("streams live events until the turn boundary, excluding the echo", async () => {
    const echo = { type: "turn.started", data: { turnId: "t1", sequence: 1 } };
    const liveEvents = [
      { type: "message.appended", data: { messageSoFar: "More" } },
      { type: "message.completed", data: { message: "More detail" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream.mockImplementationOnce(streamOf([echo, ...liveEvents]));

    const seen: unknown[] = [];
    const promise = tailEveSessionEvents(evePointer, "forge-session-1", {
      startIndex: 2,
      onEvent: (event) => seen.push(event),
    });

    await vi.advanceTimersByTimeAsync(10);

    await expect(promise).resolves.toEqual({
      events: liveEvents,
      completed: true,
    });

    expect(seen).toEqual(liveEvents);
    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 1,
      signal: expect.any(AbortSignal),
    });
  });

  it("declares the turn dead when the stream goes quiet after the echo", async () => {
    const echo = { type: "turn.started", data: { turnId: "t1", sequence: 1 } };

    mockStream.mockImplementationOnce(streamOf([echo]));

    const promise = tailEveSessionEvents(evePointer, "forge-session-1", {
      startIndex: 2,
    });

    await vi.advanceTimersByTimeAsync(30_100);

    await expect(promise).resolves.toEqual({ events: [], completed: false });
  });

  it("gives up when the server never responds", async () => {
    mockStream.mockImplementationOnce(async function* ({
      signal,
    }: {
      signal?: AbortSignal;
    } = {}) {
      await sleepUntilAbort(signal);
    });

    const promise = tailEveSessionEvents(evePointer, "forge-session-1", {
      startIndex: 2,
    });

    await vi.advanceTimersByTimeAsync(CONNECT);

    await expect(promise).resolves.toEqual({ events: [], completed: false });
  });

  it("stops streaming when aborted", async () => {
    const abortController = new AbortController();
    const echo = { type: "turn.started", data: { turnId: "t1", sequence: 1 } };
    const partial = {
      type: "message.appended",
      data: { messageSoFar: "Some" },
    };

    mockStream.mockImplementationOnce(streamOf([echo, partial]));

    const promise = tailEveSessionEvents(evePointer, "forge-session-1", {
      startIndex: 2,
      signal: abortController.signal,
    });

    await vi.advanceTimersByTimeAsync(10);
    abortController.abort();
    await vi.advanceTimersByTimeAsync(10);

    await expect(promise).resolves.toEqual({
      events: [partial],
      completed: false,
    });
  });
});
