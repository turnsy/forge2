import type { PlanChatEvent } from "@/lib/ai/plan-chat/types";

export const PLAN_CHAT_STREAM_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

export function encodePlanChatSseEvent(event: PlanChatEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function createPlanChatEventStream(
  run: (emit: (event: PlanChatEvent) => void) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const emit = (event: PlanChatEvent) => {
        controller.enqueue(encoder.encode(encodePlanChatSseEvent(event)));
      };

      try {
        await run(emit);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Plan chat failed.";
        emit({
          type: "errors",
          errors: [{ code: "INTERNAL_ERROR", message }],
        });
        emit({ type: "runStatus", status: "error" });
      } finally {
        controller.close();
      }
    },
  });
}
