import type { PlanChatEvent } from "@/lib/ai/plan-chat/types";
import { extractSseEventsFromBuffer, parseSseDataLine } from "@/lib/chat/parse-sse";
import { mapPlanChatEvent } from "@/lib/plan-chat/map-plan-chat-event";
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
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) {
    return null;
  }

  const payload = trimmed.slice(5).trim();
  if (payload.length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(payload);
    return isPlanChatSsePayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function readPlanChatSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChatEvent<WorkoutPlan>) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const block of parts) {
      for (const line of block.split("\n")) {
        const event = parsePlanChatSseDataLine(line);
        if (event) {
          onEvent(mapPlanChatEvent(event));
        }
      }
    }
  }

  buffer += decoder.decode();
  if (buffer.trim().length > 0) {
    for (const line of buffer.split("\n")) {
      const event = parsePlanChatSseDataLine(line);
      if (event) {
        onEvent(mapPlanChatEvent(event));
      }
    }
  }
}

export { extractSseEventsFromBuffer, parseSseDataLine };
