import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRestore, mockTail } = vi.hoisted(() => ({
  mockRestore: vi.fn(),
  mockTail: vi.fn(),
}));

vi.mock("@/lib/chat/adapters/plan/replay-eve-session", () => ({
  isTurnComplete: (events: { type: string }[]) => {
    const last = events.at(-1);
    return last?.type === "session.waiting" || last?.type === "session.completed";
  },
  restoreEveSessionEvents: (...args: unknown[]) => mockRestore(...args),
  tailEveSessionEvents: (...args: unknown[]) => mockTail(...args),
}));

import { resolveCoachSessionEvents } from "@/lib/chat/adapters/plan/resolve-session-events";

const evePointer = {
  sessionId: "eve-1",
  continuationToken: "token",
};

describe("resolveCoachSessionEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns persisted events when no eve pointer exists", async () => {
    const events = await resolveCoachSessionEvents(
      {
        title: "Test",
        forgeSessionId: "forge-1",
        eve: null,
        eveEvents: [{ type: "message.received", data: { message: "Hi" } }],
      },
      "forge-1",
    );

    expect(events).toHaveLength(1);
    expect(mockTail).not.toHaveBeenCalled();
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("tails Eve when persisted events exist and merges the result", async () => {
    const turnOne = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "session.waiting", data: {} },
    ];
    const turnTwo = [
      { type: "message.received", data: { message: "Again" } },
      { type: "session.waiting", data: {} },
    ];

    mockTail.mockResolvedValue(turnTwo);

    const events = await resolveCoachSessionEvents(
      {
        title: "Test",
        forgeSessionId: "forge-1",
        eve: evePointer,
        eveEvents: turnOne,
      },
      "forge-1",
    );

    expect(mockTail).toHaveBeenCalledWith(evePointer, "forge-1", turnOne.length, undefined);
    expect(events).toEqual([...turnOne, ...turnTwo]);
    expect(mockRestore).not.toHaveBeenCalled();
  });

  it("restores from Eve when no persisted events exist", async () => {
    const restored = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "session.waiting", data: {} },
    ];

    mockRestore.mockResolvedValue(restored);

    const events = await resolveCoachSessionEvents(
      {
        title: "Test",
        forgeSessionId: "forge-1",
        eve: evePointer,
        eveEvents: [],
      },
      "forge-1",
    );

    expect(mockTail).not.toHaveBeenCalled();
    expect(mockRestore).toHaveBeenCalled();
    expect(events).toEqual(restored);
  });

  it("returns incomplete persisted events instead of replaying from scratch", async () => {
    const persisted = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "actions.requested", data: { actions: [] } },
    ];

    mockTail.mockResolvedValue([]);

    const events = await resolveCoachSessionEvents(
      {
        title: "Test",
        forgeSessionId: "forge-1",
        eve: evePointer,
        eveEvents: persisted,
      },
      "forge-1",
    );

    expect(mockRestore).not.toHaveBeenCalled();
    expect(events).toEqual(persisted);
  });
});
