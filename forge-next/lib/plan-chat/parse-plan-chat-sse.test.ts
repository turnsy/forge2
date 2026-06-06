import { describe, expect, it } from "vitest";
import { encodePlanChatSseEvent } from "@/lib/ai/plan-chat/events";
import { mapPlanChatEvent } from "@/lib/plan-chat/map-plan-chat-event";
import { extractSseEventsFromBuffer } from "@/lib/plan-chat/parse-plan-chat-sse";

describe("mapPlanChatEvent", () => {
  it("maps plan artifact events to chat artifact events", () => {
    const plan = { schemaVersion: "2.0.0" as const, name: "Block", weeks: [] };
    expect(
      mapPlanChatEvent({
        type: "artifact",
        plan,
      }),
    ).toEqual({
      type: "artifact",
      artifact: plan,
      title: "Block",
    });
  });
});

describe("plan chat SSE buffer parsing", () => {
  it("extracts generic events from encoded plan-chat SSE", () => {
    const chunk = encodePlanChatSseEvent({
      type: "runStatus",
      status: "generating",
    });
    const { events, remainder } = extractSseEventsFromBuffer(chunk);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({ type: "runStatus", status: "generating" });
    expect(remainder).toBe("");
  });
});
