import { describe, expect, it } from "vitest";
import { encodePlanChatSseEvent } from "@/lib/ai/plan-chat/events";
import { mapPlanWireEvent } from "@/lib/chat/adapters/plan/map-plan-wire-event";
import { readPlanChatSseStream } from "@/lib/chat/adapters/plan/parse-plan-chat-sse";
import { extractSseEventsFromBuffer } from "@/lib/chat/parse-sse";
import type { ChatEvent } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

describe("mapPlanWireEvent", () => {
  it("maps plan artifact events to chat artifact events", () => {
    const plan = { schemaVersion: "3.0.0" as const, name: "Block", weeks: [] };
    expect(
      mapPlanWireEvent({
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

describe("readPlanChatSseStream", () => {
  it("maps streamed plan-chat wire events to client chat events", async () => {
    const plan: WorkoutPlan = {
      schemaVersion: "3.0.0",
      name: "Stream Plan",
      weeks: [],
    };
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            encodePlanChatSseEvent({ type: "runStatus", status: "parsing" }),
          ),
        );
        controller.enqueue(
          encoder.encode(
            encodePlanChatSseEvent({ type: "artifact", plan }),
          ),
        );
        controller.close();
      },
    });

    const events: ChatEvent<WorkoutPlan>[] = [];
    await readPlanChatSseStream(body, (event) => events.push(event));

    expect(events).toEqual([
      { type: "runStatus", status: "parsing" },
      { type: "artifact", artifact: plan, title: "Stream Plan" },
    ]);
  });
});
