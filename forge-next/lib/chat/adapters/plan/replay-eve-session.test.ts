import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockStream, mockSession, mockClient } = vi.hoisted(() => {
  const mockStream = vi.fn();
  const mockSession = vi.fn(() => ({ stream: mockStream }));
  const mockClient = vi.fn(() => ({ session: mockSession }));
  return { mockStream, mockSession, mockClient };
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
  IN_FLIGHT_TAIL_TIMEOUT_MS,
  replayEveSessionEvents,
  restoreEveSessionEvents,
} from "@/lib/chat/adapters/plan/replay-eve-session";

const evePointer = {
  sessionId: "eve-1",
  continuationToken: "token",
};

describe("replayEveSessionEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when sessionId is missing", async () => {
    await expect(
      replayEveSessionEvents(
        { sessionId: "", continuationToken: "token" },
        "forge-session-1",
      ),
    ).resolves.toEqual([]);
    expect(mockClient).not.toHaveBeenCalled();
  });

  it("replays stream events from the beginning through the latest turn boundary", async () => {
    const events = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.completed", data: { message: "Hi there" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream.mockImplementationOnce(async function* () {
      for (const event of events) {
        yield event;
      }
    });

    await expect(
      replayEveSessionEvents(evePointer, "forge-session-1"),
    ).resolves.toEqual(events);

    expect(mockSession).toHaveBeenCalledWith({
      sessionId: "eve-1",
      continuationToken: "token",
      streamIndex: 0,
    });
    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 0,
      signal: undefined,
    });
  });
});

describe("restoreEveSessionEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tails the stream when the replayed turn has not completed", async () => {
    const replayEvents = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.appended", data: { messageSoFar: "Working" } },
    ];
    const tailEvents = [{ type: "session.waiting", data: {} }];

    mockStream
      .mockImplementationOnce(async function* () {
        for (const event of replayEvents) {
          yield event;
        }
      })
      .mockImplementationOnce(async function* () {
        for (const event of tailEvents) {
          yield event;
        }
      });

    await expect(
      restoreEveSessionEvents(evePointer, "forge-session-1"),
    ).resolves.toEqual([...replayEvents, ...tailEvents]);

    expect(mockStream).toHaveBeenNthCalledWith(1, {
      startIndex: 0,
      signal: undefined,
    });
    expect(mockStream).toHaveBeenNthCalledWith(2, {
      startIndex: 2,
      signal: expect.any(AbortSignal),
    });
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
    ).resolves.toEqual([...turnOne, ...turnTwo]);

    expect(mockStream).toHaveBeenNthCalledWith(1, {
      startIndex: 0,
      signal: undefined,
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
      .mockImplementationOnce(async function* ({
        signal,
      }: {
        signal?: AbortSignal;
      } = {}) {
        await new Promise<void>((resolve) => {
          if (!signal || signal.aborted) {
            resolve();
            return;
          }

          signal.addEventListener("abort", () => resolve(), { once: true });
        });
      });

    await expect(
      restoreEveSessionEvents(evePointer, "forge-session-1"),
    ).resolves.toEqual(turnOne);

    expect(mockStream).toHaveBeenCalledTimes(2);
    expect(mockStream).toHaveBeenNthCalledWith(2, {
      startIndex: 3,
      signal: expect.any(AbortSignal),
    });
  });

  it("tails from a persisted checkpoint when the turn is still in flight", async () => {
    const persistedPrefix = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.appended", data: { messageSoFar: "Working" } },
    ];
    const tailEvents = [{ type: "session.waiting", data: {} }];

    mockStream
      .mockImplementationOnce(async function* () {
        for (const event of tailEvents) {
          yield event;
        }
      })
      .mockImplementationOnce(async function* ({
        signal,
      }: {
        signal?: AbortSignal;
      } = {}) {
        await new Promise<void>((resolve) => {
          if (!signal || signal.aborted) {
            resolve();
            return;
          }

          signal.addEventListener("abort", () => resolve(), { once: true });
        });
      });

    await expect(
      restoreEveSessionEvents(evePointer, "forge-session-1", {
        fromEvents: persistedPrefix,
      }),
    ).resolves.toEqual([...persistedPrefix, ...tailEvents]);

    expect(mockStream).toHaveBeenNthCalledWith(1, {
      startIndex: 2,
      signal: expect.any(AbortSignal),
    });
    expect(mockStream).toHaveBeenNthCalledWith(2, {
      startIndex: 3,
      signal: expect.any(AbortSignal),
    });
  });

  it("returns the persisted prefix when tailing an in-flight turn times out", async () => {
    vi.useFakeTimers();

    const persistedPrefix = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "turn.started", data: { turnId: "turn-1", sequence: 1 } },
    ];

    mockStream.mockImplementation(async function* ({
      signal,
    }: {
      signal?: AbortSignal;
    } = {}) {
      await new Promise<void>((resolve) => {
        if (!signal || signal.aborted) {
          resolve();
          return;
        }

        signal.addEventListener("abort", () => resolve(), { once: true });
      });
    });

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1", {
      fromEvents: persistedPrefix,
    });

    await vi.advanceTimersByTimeAsync(IN_FLIGHT_TAIL_TIMEOUT_MS + 1);
    await expect(promise).resolves.toEqual(persistedPrefix);

    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 2,
      signal: expect.any(AbortSignal),
    });

    vi.useRealTimers();
  });

  it("returns persisted events when the checkpoint is already complete and no new turns exist", async () => {
    const persistedPrefix = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.completed", data: { message: "Hi there" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream.mockImplementationOnce(async function* ({
      signal,
    }: {
      signal?: AbortSignal;
    } = {}) {
      await new Promise<void>((resolve) => {
        if (!signal || signal.aborted) {
          resolve();
          return;
        }

        signal.addEventListener("abort", () => resolve(), { once: true });
      });
    });

    await expect(
      restoreEveSessionEvents(evePointer, "forge-session-1", {
        fromEvents: persistedPrefix,
      }),
    ).resolves.toEqual(persistedPrefix);

    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 3,
      signal: expect.any(AbortSignal),
    });
  });
});
