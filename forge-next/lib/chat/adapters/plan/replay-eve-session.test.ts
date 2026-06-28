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

  it("replays stream events from the eve session cursor", async () => {
    const events = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.completed", data: { message: "Hi there" } },
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
    ).resolves.toEqual(events);

    expect(mockClient).toHaveBeenCalledWith({
      headers: {
        "x-forge-session-id": "forge-session-1",
      },
    });
    expect(mockSession).toHaveBeenCalledWith({
      sessionId: "eve-1",
      continuationToken: "token",
      streamIndex: 2,
    });
  });
});
