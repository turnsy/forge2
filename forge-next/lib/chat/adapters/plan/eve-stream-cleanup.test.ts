import { afterEach, describe, expect, it, vi } from "vitest";
import { EveAgentStore } from "eve/client";
import { createForgeEveClient } from "./forge-eve-client";
import { createEveCoachReducer } from "./eve-coach-reducer";

describe("Eve stream completion cleanup", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the turn active until the real completion boundary arrives", async () => {
    let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
    const encode = (events: unknown[]) => new TextEncoder().encode(events.map((event) => JSON.stringify(event)).join("\n") + "\n");
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") return Response.json({ sessionId: "eve-1", continuationToken: "token-1" });
      return new Response(new ReadableStream<Uint8Array>({ start(value) {
        controller = value;
        value.enqueue(encode([
          { type: "turn.started", data: { turnId: "turn-1", sequence: 1 } },
          { type: "message.completed", data: { message: "Visible reply", finishReason: "stop", turnId: "turn-1", sequence: 1, stepIndex: 0 } },
        ]));
      } }));
    }));
    const store = new EveAgentStore({ session: createForgeEveClient("forge-1").session(), reducer: createEveCoachReducer() });
    const send = store.send({ message: "Question" });
    try {
      await vi.waitFor(() => expect(store.snapshot.events).toHaveLength(2));
      expect(store.snapshot.status).toBe("streaming");
      expect(store.snapshot.data.streamingAssistantText).toBe("Visible reply");
      controller!.enqueue(encode([
        { type: "turn.completed", data: { turnId: "turn-1", sequence: 1 } },
        { type: "session.waiting", data: { wait: "next-user-message" } },
      ]));
      await send;
      expect(store.snapshot.status).toBe("ready");
    } finally {
      if (store.snapshot.status === "streaming") controller?.close();
      await send;
    }
  });

  it("settles a completed reply and allows the next turn even when transport cancellation stalls", async () => {
    let turn = 0;
    const releaseCancellation: (() => void)[] = [];
    const bodies: ReadableStream<Uint8Array>[] = [];
    const cancel = vi.fn(() => new Promise<void>((resolve) => releaseCancellation.push(resolve)));
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        turn += 1;
        return Response.json({ sessionId: "eve-1", ...(turn === 1 ? { continuationToken: "token-1" } : {}) });
      }
      expect(new URL(url, "https://forge.test").searchParams.get("startIndex") ?? "0").toBe(String((turn - 1) * 5));
      const events = [
        { type: "turn.started", data: { sequence: turn, turnId: `turn-${turn}` } },
        { type: "message.received", data: { message: `Question ${turn}`, sequence: turn, turnId: `turn-${turn}` } },
        { type: "message.completed", data: { message: `Reply ${turn}`, finishReason: "stop", sequence: turn, stepIndex: 0, turnId: `turn-${turn}` } },
        { type: "turn.completed", data: { sequence: turn, turnId: `turn-${turn}` } },
        { type: "session.waiting", data: { wait: "next-user-message" } },
      ];
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(events.map((event) => JSON.stringify(event)).join("\n") + "\n"));
          // Durable event streams may stay open between conversation turns.
        },
        cancel,
      });
      bodies.push(body);
      return new Response(body);
    }));
    const store = new EveAgentStore({ session: createForgeEveClient("forge-1").session(), reducer: createEveCoachReducer() });
    const sends: Promise<void>[] = [];
    try {
      for (let turn = 1; turn <= 2; turn += 1) {
        sends.push(store.send({ message: `Question ${turn}` }));
        await vi.waitFor(() => {
          expect(store.snapshot.events).toHaveLength(turn * 5);
          expect(store.snapshot.events.at(-1)?.type).toBe("session.waiting");
        });
        expect(store.snapshot.data.phase).toBe("idle");
        expect(store.snapshot.data.messages.at(-1)?.content).toBe(`Reply ${turn}`);
        await vi.waitFor(() => expect(store.snapshot.status).toBe("ready"), { timeout: 200 });
        expect(store.snapshot.session).toEqual({ sessionId: "eve-1", continuationToken: "token-1", streamIndex: turn * 5 });
        expect(bodies.at(-1)?.locked).toBe(false);
      }
      expect(cancel).toHaveBeenCalledTimes(2);
    } finally {
      for (const release of releaseCancellation) release();
      await Promise.all(sends);
    }
  });
});
