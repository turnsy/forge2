import { describe, expect, it, vi } from "vitest";
import { bindForgeEveSessionSend } from "@/lib/chat/adapters/plan/forge-eve-client";

describe("bindForgeEveSessionSend", () => {
  it("invokes onPostResponse with POST metadata before returning", async () => {
    const onPostResponse = vi.fn();
    const response = {
      sessionId: "eve-123",
      continuationToken: "token-abc",
      result: vi.fn(),
      [Symbol.asyncIterator]: vi.fn(),
    };
    const originalSend = vi.fn().mockResolvedValue(response);
    const session = { send: originalSend } as Parameters<
      typeof bindForgeEveSessionSend
    >[0];

    const bound = bindForgeEveSessionSend(session, onPostResponse);
    const result = await bound.send({ message: "Hello" });

    expect(originalSend).toHaveBeenCalledWith({ message: "Hello" });
    expect(onPostResponse).toHaveBeenCalledWith({
      sessionId: "eve-123",
      continuationToken: "token-abc",
    });
    expect(result).toBe(response);
  });
});
