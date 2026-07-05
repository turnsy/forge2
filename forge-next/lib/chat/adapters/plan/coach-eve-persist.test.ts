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
});
