import { afterEach, describe, expect, it, vi } from "vitest";
import { bindForgeEveSessionSend, createForgeEveClient } from "@/lib/chat/adapters/plan/forge-eve-client";

describe("bindForgeEveSessionSend", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([false, true])("streams consecutive replies with the real Eve client (restore=%s)", async (restore) => {
    let turn = 0;
    const fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        turn += 1;
        if (turn > 1) {
          expect(JSON.parse(init.body as string).continuationToken).toBe("token-abc");
        }
        return Response.json({
          sessionId: "eve-123",
          ...(turn === 1 ? { continuationToken: "token-abc" } : {}),
        });
      }
      expect(new URL(url, "https://forge.test").searchParams.get("startIndex") ?? "0")
        .toBe(String((turn - 1) * 2));
      return new Response([
        { type: "message.completed", data: { message: `Reply ${turn}`, finishReason: "stop", sequence: turn, stepIndex: 0, turnId: `turn-${turn}` } },
        { type: "session.waiting", data: {} },
      ].map((event) => JSON.stringify(event)).join("\n") + "\n");
    });
    vi.stubGlobal("fetch", fetch);
    const onPostResponse = vi.fn();
    const client = createForgeEveClient("forge-123");
    let session = bindForgeEveSessionSend(client.session(), onPostResponse);

    for (let turn = 1; turn <= 3; turn += 1) {
      const response = await session.send(`Message ${turn}`);
      expect((await response.result()).message).toBe(`Reply ${turn}`);
      expect(session.state).toEqual({ sessionId: "eve-123", continuationToken: "token-abc", streamIndex: turn * 2 });
      expect(onPostResponse).toHaveBeenLastCalledWith({ sessionId: "eve-123", continuationToken: "token-abc" });
      if (restore) {
        session = bindForgeEveSessionSend(client.session(JSON.parse(JSON.stringify(session.state))), onPostResponse);
      }
    }
  });
  it("preserves the continuation token when the follow-up POST omits it", async () => {
    const onPostResponse = vi.fn();
    const session = {
      state: { sessionId: "eve-123", continuationToken: "token-abc", streamIndex: 5 },
      send: vi.fn().mockResolvedValue({ sessionId: "eve-123" }),
    } as unknown as Parameters<typeof bindForgeEveSessionSend>[0];

    await bindForgeEveSessionSend(session, onPostResponse).send("Follow up");

    expect(onPostResponse).toHaveBeenCalledWith({
      sessionId: "eve-123",
      continuationToken: "token-abc",
    });
  });
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
