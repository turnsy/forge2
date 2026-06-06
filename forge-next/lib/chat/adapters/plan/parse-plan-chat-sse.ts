import type { PlanChatEvent } from "@/lib/ai/plan-chat/types";
import { parseSseJsonLine, readSseStream } from "@/lib/chat/parse-sse";
import { mapPlanWireEvent } from "@/lib/chat/adapters/plan/map-plan-wire-event";
import type { ChatEvent } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const PLAN_EVENT_TYPES = new Set([
  "assistantTextDelta",
  "runStatus",
  "artifact",
  "warnings",
  "errors",
]);

function isPlanChatSsePayload(value: unknown): value is PlanChatEvent {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }

  const type = (value as { type: unknown }).type;
  return typeof type === "string" && PLAN_EVENT_TYPES.has(type);
}

function parsePlanChatSseDataLine(line: string): PlanChatEvent | null {
  return parseSseJsonLine(line, isPlanChatSsePayload);
}

export async function readPlanChatSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChatEvent<WorkoutPlan>) => void,
): Promise<void> {
  await readSseStream(body, parsePlanChatSseDataLine, (event) => {
    onEvent(mapPlanWireEvent(event));
  });
}
