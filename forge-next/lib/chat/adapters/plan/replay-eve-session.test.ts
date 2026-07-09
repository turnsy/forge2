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

function streamThatWaitsForAbort(
  prefixEvents: { type: string; data?: unknown }[] = [],
) {
  return async function* ({ signal }: { signal?: AbortSignal } = {}) {
    for (const event of prefixEvents) {
      yield event;
    }

    await new Promise<void>((resolve) => {
      if (!signal || signal.aborted) {
        resolve();
        return;
      }

      signal.addEventListener("abort", () => resolve(), { once: true });
    });
  };
}

describe("restoreEveSessionEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an in-flight replay without blocking for the turn to finish", async () => {
    const replayEvents = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.appended", data: { messageSoFar: "Working" } },
    ];

    mockStream.mockImplementationOnce(async function* () {
      for (const event of replayEvents) {
        yield event;
      }
    });

    await expect(
      restoreEveSessionEvents(evePointer, "forge-session-1"),
    ).resolves.toEqual({
      events: replayEvents,
      needsLiveTail: true,
      markerApplies: false,
    });

    expect(mockStream).toHaveBeenCalledOnce();
  });

  it("replays every completed turn in the session", async () => {
    const turnOne = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.completed", data: { message: "Hi there" } },
      { type: "session.waiting", data: {} },
    ];
    const turnTwo = [
      { type: "message.received", data: { message: "Again" } },
      { type: "message.completed", data: { message: "Sure" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream
      .mockImplementationOnce(async function* () {
        for (const event of turnOne) {
          yield event;
        }
      })
      .mockImplementationOnce(async function* () {
        for (const event of turnTwo) {
          yield event;
        }
      })
      .mockImplementationOnce(async function* () {});

    await expect(
      restoreEveSessionEvents(evePointer, "forge-session-1"),
    ).resolves.toEqual({
      events: [...turnOne, ...turnTwo],
      needsLiveTail: false,
      markerApplies: false,
    });

    expect(mockStream).toHaveBeenNthCalledWith(2, {
      startIndex: 3,
      signal: expect.any(AbortSignal),
    });
  });

  it("stops after the final turn instead of waiting on a live stream", async () => {
    const turnOne = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.completed", data: { message: "Hi there" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream
      .mockImplementationOnce(async function* () {
        for (const event of turnOne) {
          yield event;
        }
      })
      .mockImplementationOnce(streamThatWaitsForAbort());

    await expect(
      restoreEveSessionEvents(evePointer, "forge-session-1"),
    ).resolves.toEqual({
      events: turnOne,
      needsLiveTail: false,
      markerApplies: false,
    });

    expect(mockStream).toHaveBeenCalledTimes(2);
  });

  it("hands a mid-turn checkpoint without a marker to the live tail", async () => {
    const persistedPrefix = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.appended", data: { messageSoFar: "Working" } },
    ];

    await expect(
      restoreEveSessionEvents(evePointer, "forge-session-1", {
        fromEvents: persistedPrefix,
      }),
    ).resolves.toEqual({
      events: persistedPrefix,
      needsLiveTail: true,
      markerApplies: false,
    });

    expect(mockStream).not.toHaveBeenCalled();
  });

  it("keeps a marker-annotated mid-turn log settled when the server has nothing newer", async () => {
    vi.useFakeTimers();

    const persistedPrefix = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "turn.started", data: { turnId: "turn-1", sequence: 1 } },
    ];

    mockStream.mockImplementationOnce(streamThatWaitsForAbort());

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persistedPrefix,
      lastTurn: { status: "stopped", eventCount: 2 },
    });

    await vi.advanceTimersByTimeAsync(2_001);

    await expect(promise).resolves.toEqual({
      events: persistedPrefix,
      needsLiveTail: false,
      markerApplies: true,
    });

    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 2,
      signal: expect.any(AbortSignal),
    });
  });

  it("discards the marker when the server log advanced past it", async () => {
    vi.useFakeTimers();

    const persistedPrefix = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "turn.started", data: { turnId: "turn-1", sequence: 1 } },
    ];
    const serverTail = [
      { type: "message.completed", data: { message: "Done after all" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream
      .mockImplementationOnce(async function* () {
        for (const event of serverTail) {
          yield event;
        }
      })
      .mockImplementationOnce(streamThatWaitsForAbort());

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persistedPrefix,
      lastTurn: { status: "stopped", eventCount: 2 },
    });

    await vi.advanceTimersByTimeAsync(5_000);

    await expect(promise).resolves.toEqual({
      events: [...persistedPrefix, ...serverTail],
      needsLiveTail: false,
      markerApplies: false,
    });
  });

  it("ignores a stale marker recorded for a different event count", async () => {
    const persistedPrefix = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "turn.started", data: { turnId: "turn-1", sequence: 1 } },
    ];

    await expect(
      restoreEveSessionEvents(evePointer, "forge-session-1", {
        fromEvents: persistedPrefix,
        lastTurn: { status: "stopped", eventCount: 1 },
      }),
    ).resolves.toEqual({
      events: persistedPrefix,
      needsLiveTail: true,
      markerApplies: false,
    });
  });

  it("returns persisted events when the checkpoint is already complete and no new turns exist", async () => {
    vi.useFakeTimers();

    const persistedPrefix = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.completed", data: { message: "Hi there" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream.mockImplementationOnce(streamThatWaitsForAbort());

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persistedPrefix,
    });

    await vi.advanceTimersByTimeAsync(2_001);

    await expect(promise).resolves.toEqual({
      events: persistedPrefix,
      needsLiveTail: false,
      markerApplies: false,
    });

    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 3,
      signal: expect.any(AbortSignal),
    });
  });
});

describe("tailEveSessionEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("streams live events until the turn boundary", async () => {
    const liveEvents = [
      { type: "message.appended", data: { messageSoFar: "More" } },
      { type: "message.completed", data: { message: "More detail" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream.mockImplementationOnce(async function* () {
      for (const event of liveEvents) {
        yield event;
      }
    });

    const seen: unknown[] = [];
    await expect(
      tailEveSessionEvents(evePointer, "forge-session-1", {
        startIndex: 2,
        onEvent: (event) => seen.push(event),
      }),
    ).resolves.toEqual({ events: liveEvents, completed: true });

    expect(seen).toEqual(liveEvents);
    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 2,
      signal: expect.any(AbortSignal),
    });
  });

  it("gives up when no first event arrives within the probe window", async () => {
    vi.useFakeTimers();

    mockStream.mockImplementationOnce(streamThatWaitsForAbort());

    const promise = tailEveSessionEvents(evePointer, "forge-session-1", {
      startIndex: 2,
    });

    await vi.advanceTimersByTimeAsync(4_001);

    await expect(promise).resolves.toEqual({ events: [], completed: false });
  });

  it("gives up when the live stream goes quiet mid-turn", async () => {
    vi.useFakeTimers();

    mockStream.mockImplementationOnce(async function* ({
      signal,
    }: {
      signal?: AbortSignal;
    } = {}) {
      yield { type: "message.appended", data: { messageSoFar: "Some" } };

      await new Promise<void>((resolve) => {
        if (!signal || signal.aborted) {
          resolve();
          return;
        }

        signal.addEventListener("abort", () => resolve(), { once: true });
      });
    });

    const promise = tailEveSessionEvents(evePointer, "forge-session-1", {
      startIndex: 2,
    });

    await vi.advanceTimersByTimeAsync(30_001);

    await expect(promise).resolves.toEqual({
      events: [{ type: "message.appended", data: { messageSoFar: "Some" } }],
      completed: false,
    });
  });

  it("stops streaming when aborted", async () => {
    vi.useFakeTimers();

    const abortController = new AbortController();

    mockStream.mockImplementationOnce(async function* ({
      signal,
    }: {
      signal?: AbortSignal;
    } = {}) {
      yield { type: "message.appended", data: { messageSoFar: "Some" } };

      await new Promise<void>((resolve) => {
        if (!signal || signal.aborted) {
          resolve();
          return;
        }

        signal.addEventListener("abort", () => resolve(), { once: true });
      });
    });

    const promise = tailEveSessionEvents(evePointer, "forge-session-1", {
      startIndex: 0,
      signal: abortController.signal,
    });

    await vi.advanceTimersByTimeAsync(10);
    abortController.abort();
    await vi.advanceTimersByTimeAsync(10);

    await expect(promise).resolves.toEqual({
      events: [{ type: "message.appended", data: { messageSoFar: "Some" } }],
      completed: false,
    });
  });
});
