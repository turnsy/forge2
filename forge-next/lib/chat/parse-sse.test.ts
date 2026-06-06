import { describe, expect, it } from "vitest";
import {
  extractSseEventsFromBuffer,
  parseSseDataLine,
} from "@/lib/chat/parse-sse";

function encodeChatSseEvent(event: object): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

describe("parseSseDataLine", () => {
  it("parses encoded chat events", () => {
    const line = encodeChatSseEvent({
      type: "runStatus",
      status: "generating",
    }).trim();
    expect(parseSseDataLine(line)).toEqual({
      type: "runStatus",
      status: "generating",
    });
  });
});

describe("extractSseEventsFromBuffer", () => {
  it("handles multiple events in one chunk", () => {
    const chunk =
      encodeChatSseEvent({
        type: "assistantTextDelta",
        delta: "Hi",
      }) + encodeChatSseEvent({ type: "runStatus", status: "done" });
    const { events, remainder } = extractSseEventsFromBuffer(chunk);
    expect(events).toHaveLength(2);
    expect(remainder).toBe("");
  });

  it("keeps a partial event in the remainder", () => {
    const full = encodeChatSseEvent({
      type: "assistantTextDelta",
      delta: "x",
    });
    const partial = full.slice(0, 12);
    const { events, remainder } = extractSseEventsFromBuffer(partial);
    expect(events).toHaveLength(0);
    expect(remainder).toBe(partial);
  });
});
