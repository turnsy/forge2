import type { ChatEvent } from "@/lib/chat/types";

const EVENT_TYPES = new Set([
  "assistantTextDelta",
  "runStatus",
  "artifact",
  "warnings",
  "errors",
]);

export function isChatEvent(value: unknown): value is ChatEvent {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }

  const type = (value as { type: unknown }).type;
  return typeof type === "string" && EVENT_TYPES.has(type);
}

export function parseSseJsonLine<T>(
  line: string,
  guard: (value: unknown) => value is T,
): T | null {
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
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function parseSseDataLine(line: string): ChatEvent | null {
  return parseSseJsonLine(line, isChatEvent);
}

function extractEventsFromBuffer<T>(
  buffer: string,
  parseLine: (line: string) => T | null,
): { events: T[]; remainder: string } {
  const events: T[] = [];
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const block of parts) {
    for (const line of block.split("\n")) {
      const event = parseLine(line);
      if (event) {
        events.push(event);
      }
    }
  }

  return { events, remainder };
}

export function extractSseEventsFromBuffer(buffer: string): {
  events: ChatEvent[];
  remainder: string;
} {
  return extractEventsFromBuffer(buffer, parseSseDataLine);
}

export async function readSseStream<T>(
  body: ReadableStream<Uint8Array>,
  parseLine: (line: string) => T | null,
  onEvent: (event: T) => void,
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
    const parsed = extractEventsFromBuffer(buffer, parseLine);
    buffer = parsed.remainder;
    for (const event of parsed.events) {
      onEvent(event);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim().length > 0) {
    const parsed = extractEventsFromBuffer(`${buffer}\n\n`, parseLine);
    for (const event of parsed.events) {
      onEvent(event);
    }
  }
}

export async function readChatSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: ChatEvent) => void,
): Promise<void> {
  await readSseStream(body, parseSseDataLine, onEvent);
}
