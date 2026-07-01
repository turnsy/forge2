/**
 * @vitest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
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

import { useCoachEveLiveTail } from "@/lib/chat/adapters/plan/use-coach-eve-live-tail";

const evePointer = {
  sessionId: "eve-1",
  continuationToken: "token",
};

describe("useCoachEveLiveTail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("streams in-flight turn events and marks the turn complete", async () => {
    const baseEvents = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "message.appended", data: { messageSoFar: "Working" } },
    ];
    const tailEvents = [{ type: "session.waiting", data: {} }];

    mockStream.mockImplementation(async function* () {
      for (const event of tailEvents) {
        yield event;
      }
    });

    const { result } = renderHook(() =>
      useCoachEveLiveTail({
        forgeSessionId: "forge-1",
        eve: evePointer,
        baseEvents,
        enabled: true,
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("complete");
    });

    if (result.current.status === "complete") {
      expect(result.current.events).toEqual([...baseEvents, ...tailEvents]);
    }
  });
});
