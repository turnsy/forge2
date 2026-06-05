import { describe, expect, it } from "vitest";
import { encodePlanChatSseEvent } from "@/lib/ai/plan-chat/events";
import {
  extractSseEventsFromBuffer,
  parseSseDataLine,
} from "@/lib/plan-chat/parse-sse";

describe("parseSseDataLine", () => {
  it("parses encoded plan chat events", () => {
    const line = encodePlanChatSseEvent({
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
      encodePlanChatSseEvent({
        type: "assistantTextDelta",
        delta: "Hi",
      }) +
      encodePlanChatSseEvent({ type: "runStatus", status: "done" });
    const { events, remainder } = extractSseEventsFromBuffer(chunk);
    expect(events).toHaveLength(2);
    expect(remainder).toBe("");
  });

  it("keeps a partial event in the remainder", () => {
    const full = encodePlanChatSseEvent({
      type: "assistantTextDelta",
      delta: "x",
    });
    const partial = full.slice(0, 12);
    const { events, remainder } = extractSseEventsFromBuffer(partial);
    expect(events).toHaveLength(0);
    expect(remainder).toBe(partial);
  });
});
