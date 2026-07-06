import { beforeEach, describe, expect, it, vi } from "vitest";

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
} from "@/lib/chat/adapters/plan/replay-eve-session";

const evePointer = {
  sessionId: "eve-1",
  continuationToken: "token",
};

describe("restoreEveSessionEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    ).resolves.toEqual(replayEvents);

    expect(mockStream).toHaveBeenCalledOnce();
    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 0,
      signal: undefined,
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

  it("returns a persisted in-flight checkpoint without blocking on Eve", async () => {
    const persistedPrefix = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.appended", data: { messageSoFar: "Working" } },
    ];

    await expect(
      restoreEveSessionEvents(evePointer, "forge-session-1", {
        fromEvents: persistedPrefix,
      }),
    ).resolves.toEqual(persistedPrefix);

    expect(mockStream).not.toHaveBeenCalled();
  });

  it("probes briefly when the next turn is already in flight", async () => {
    vi.useFakeTimers();

    const turnOne = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.completed", data: { message: "Hi there" } },
      { type: "session.waiting", data: {} },
    ];
    const inFlightStart = [
      { type: "message.received", data: { message: "Again" } },
      { type: "turn.started", data: { turnId: "turn-2", sequence: 2 } },
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
        for (const event of inFlightStart) {
          yield event;
        }

        await new Promise<void>((resolve) => {
          if (!signal || signal.aborted) {
            resolve();
            return;
          }

          signal.addEventListener("abort", () => resolve(), { once: true });
        });
      });

    const promise = restoreEveSessionEvents(evePointer, "forge-session-1");

    await vi.advanceTimersByTimeAsync(2_001);
    await expect(promise).resolves.toEqual([...turnOne, ...inFlightStart]);

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
