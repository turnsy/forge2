import { describe, expect, it } from "vitest";
import {
  getEveStreamTailStartIndex,
  mayHaveInFlightEveTurn,
} from "@/lib/chat/adapters/plan/eve-session-status";

const evePointer = {
  sessionId: "eve-1",
  continuationToken: "token",
};

describe("eve session status", () => {
  it("detects an in-flight turn when streamIndex is ahead of persisted events", () => {
    const turnOne = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "session.waiting", data: {} },
    ];

    expect(
      mayHaveInFlightEveTurn(
        {
          title: "Test",
          forgeSessionId: "forge-1",
          eve: { ...evePointer, streamIndex: 5 },
          eveEvents: turnOne,
        },
        turnOne,
      ),
    ).toBe(true);
  });

  it("returns false when persisted events match the stream cursor", () => {
    const turnOne = [
      { type: "message.received", data: { message: "Hello" } },
      { type: "session.waiting", data: {} },
    ];

    expect(
      mayHaveInFlightEveTurn(
        {
          title: "Test",
          forgeSessionId: "forge-1",
          eve: { ...evePointer, streamIndex: turnOne.length },
          eveEvents: turnOne,
        },
        turnOne,
      ),
    ).toBe(false);
  });

  it("tails from the persisted event count", () => {
    expect(
      getEveStreamTailStartIndex(
        { ...evePointer, streamIndex: 8 },
        [{ type: "session.waiting", data: {} }],
      ),
    ).toBe(1);
  });
});
