import type { PlanChatEvent } from "@/lib/ai/plan-chat/types";

const EVENT_TYPES = new Set([
  "assistantTextDelta",
  "runStatus",
  "artifact",
  "warnings",
  "errors",
]);

export function isPlanChatEvent(value: unknown): value is PlanChatEvent {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }

  const type = (value as { type: unknown }).type;
  return typeof type === "string" && EVENT_TYPES.has(type);
}

export function parseSseDataLine(line: string): PlanChatEvent | null {
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
    return isPlanChatEvent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function extractSseEventsFromBuffer(buffer: string): {
  events: PlanChatEvent[];
  remainder: string;
} {
  const events: PlanChatEvent[] = [];
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const block of parts) {
    for (const line of block.split("\n")) {
      const event = parseSseDataLine(line);
      if (event) {
        events.push(event);
      }
    }
  }

  return { events, remainder };
}

export async function readPlanChatSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: PlanChatEvent) => void,
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
    const parsed = extractSseEventsFromBuffer(buffer);
    buffer = parsed.remainder;
    for (const event of parsed.events) {
      onEvent(event);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim().length > 0) {
    const parsed = extractSseEventsFromBuffer(`${buffer}\n\n`);
    for (const event of parsed.events) {
      onEvent(event);
    }
  }
}
