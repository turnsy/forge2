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

import { replayEveSessionEvents } from "@/lib/chat/adapters/plan/replay-eve-session";

describe("replayEveSessionEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array when sessionId is missing", async () => {
    await expect(
      replayEveSessionEvents({ streamIndex: 0 }, "forge-session-1"),
    ).resolves.toEqual([]);
    expect(mockClient).not.toHaveBeenCalled();
  });

  it("returns an empty array when streamIndex is zero", async () => {
    await expect(
      replayEveSessionEvents(
        { sessionId: "eve-1", continuationToken: "token", streamIndex: 0 },
        "forge-session-1",
      ),
    ).resolves.toEqual([]);
    expect(mockClient).not.toHaveBeenCalled();
  });

  it("replays stream events from the beginning through the saved cursor", async () => {
    const events = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.completed", data: { message: "Hi there" } },
      { type: "session.waiting", data: {} },
    ];

    mockStream.mockImplementation(async function* () {
      for (const event of events) {
        yield event;
      }
    });

    await expect(
      replayEveSessionEvents(
        {
          sessionId: "eve-1",
          continuationToken: "token",
          streamIndex: 2,
        },
        "forge-session-1",
      ),
    ).resolves.toEqual(events.slice(0, 2));

    expect(mockSession).toHaveBeenCalledWith({
      sessionId: "eve-1",
      continuationToken: "token",
      streamIndex: 2,
    });
    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 0,
      signal: undefined,
    });
  });

  it("passes through abort signals", async () => {
    const abortController = new AbortController();

    mockStream.mockImplementation(async function* () {
      yield { type: "message.received", data: { message: "Hello" } };
    });

    await replayEveSessionEvents(
      {
        sessionId: "eve-1",
        continuationToken: "token",
        streamIndex: 1,
      },
      "forge-session-1",
      { signal: abortController.signal },
    );

    expect(mockStream).toHaveBeenCalledWith({
      startIndex: 0,
      signal: abortController.signal,
    });
  });
});
