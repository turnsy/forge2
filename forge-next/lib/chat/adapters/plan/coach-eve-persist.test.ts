import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCoachEvePersister } from "@/lib/chat/adapters/plan/coach-eve-persist";

describe("createCoachEvePersister", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("persists immediately on the first streamed event", async () => {
    const saveSnapshot = vi.fn().mockResolvedValue(true);
    const persister = createCoachEvePersister({
      forgeSessionId: "forge-1",
      getTitle: () => "Bench block",
      saveSnapshot,
    });

    const session = { sessionId: "eve-1", streamIndex: 0 };
    const event = { type: "message.received", data: { message: "Hello" } };
    const events = [event];

    await persister.onStreamEvent(session, events, event);

    expect(saveSnapshot).toHaveBeenCalledTimes(1);
  });

  it("debounces mid-turn persistence", async () => {
    const saveSnapshot = vi.fn().mockResolvedValue(true);
    const persister = createCoachEvePersister({
      forgeSessionId: "forge-1",
      getTitle: () => null,
      saveSnapshot,
    });

    const session = { sessionId: "eve-1", streamIndex: 1 };
    const first = { type: "message.received", data: { message: "Hello" } };
    const second = { type: "message.appended", data: { messageSoFar: "Hi" } };

    await persister.onStreamEvent(session, [first], first);
    await persister.onStreamEvent(session, [first, second], second);

    expect(saveSnapshot).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2_000);

    expect(saveSnapshot).toHaveBeenCalledTimes(2);
  });

  it("persists immediately on turn boundaries", async () => {
    const saveSnapshot = vi.fn().mockResolvedValue(true);
    const persister = createCoachEvePersister({
      forgeSessionId: "forge-1",
      getTitle: () => null,
      saveSnapshot,
    });

    const session = { sessionId: "eve-1", streamIndex: 2 };
    const events = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "session.waiting", data: {} },
    ];

    await persister.onStreamEvent(session, events, events[1]!);

    expect(saveSnapshot).toHaveBeenCalledTimes(1);
  });

  it("serializes writes so a slow earlier save cannot overwrite a newer one", async () => {
    const completionOrder: number[] = [];
    let releaseFirst: (() => void) | undefined;

    const saveSnapshot = vi.fn(
      (snapshot: { events: readonly unknown[] }) =>
        new Promise<boolean>((resolve) => {
          if (snapshot.events.length === 1) {
            // The first write hangs until released, simulating a slow
            // server action.
            releaseFirst = () => {
              completionOrder.push(1);
              resolve(true);
            };
            return;
          }

          completionOrder.push(snapshot.events.length);
          resolve(true);
        }),
    );

    const persister = createCoachEvePersister({
      forgeSessionId: "forge-1",
      getTitle: () => null,
      saveSnapshot,
    });

    const session = { sessionId: "eve-1", streamIndex: 0 };
    const first = [{ type: "message.received" }];
    const second = [{ type: "message.received" }, { type: "session.waiting" }];

    const firstWrite = persister.flush(session, first);
    const secondWrite = persister.flush(session, second);
    await vi.advanceTimersByTimeAsync(0);

    // The second write must wait for the first to land.
    expect(saveSnapshot).toHaveBeenCalledTimes(1);

    releaseFirst?.();
    await firstWrite;
    await secondWrite;

    expect(completionOrder).toEqual([1, 2]);
  });

  it("drops writes with fewer events than one already issued", async () => {
    const saveSnapshot = vi.fn().mockResolvedValue(true);
    const persister = createCoachEvePersister({
      forgeSessionId: "forge-1",
      getTitle: () => null,
      saveSnapshot,
    });

    const session = { sessionId: "eve-1", streamIndex: 0 };
    const newer = [{ type: "message.received" }, { type: "session.waiting" }];
    const stale = [{ type: "message.received" }];

    await persister.flush(session, newer);
    await persister.flush(session, stale);

    expect(saveSnapshot).toHaveBeenCalledTimes(1);
    expect(saveSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ events: newer }),
    );
  });

  it("allows a same-length write so a stop marker can annotate the latest snapshot", async () => {
    const saveSnapshot = vi.fn().mockResolvedValue(true);
    const persister = createCoachEvePersister({
      forgeSessionId: "forge-1",
      getTitle: () => null,
      saveSnapshot,
    });

    const session = { sessionId: "eve-1", streamIndex: 0 };
    const events = [{ type: "message.received" }];

    await persister.flush(session, events);
    await persister.flush(session, events, {
      status: "stopped",
      eventCount: 1,
    });

    expect(saveSnapshot).toHaveBeenCalledTimes(2);
    expect(saveSnapshot).toHaveBeenLastCalledWith(
      expect.objectContaining({
        lastTurn: { status: "stopped", eventCount: 1 },
      }),
    );
  });

  it("reset clears the high-water mark so a restarted workspace can persist again", async () => {
    const saveSnapshot = vi.fn().mockResolvedValue(true);
    const persister = createCoachEvePersister({
      forgeSessionId: "forge-1",
      getTitle: () => null,
      saveSnapshot,
    });

    const session = { sessionId: "eve-1", streamIndex: 0 };
    const firstTurn = [
      { type: "message.received" },
      { type: "session.waiting" },
    ];
    const restartedTurn = [{ type: "message.received" }];

    await persister.flush(session, firstTurn);
    await persister.flush(session, restartedTurn);

    expect(saveSnapshot).toHaveBeenCalledTimes(1);

    persister.reset();

    await persister.flush(session, restartedTurn);

    expect(saveSnapshot).toHaveBeenCalledTimes(2);
    expect(saveSnapshot).toHaveBeenLastCalledWith(
      expect.objectContaining({ events: restartedTurn }),
    );
  });
});
