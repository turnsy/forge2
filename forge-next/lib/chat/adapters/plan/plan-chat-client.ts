import type { PlanChatRequestBody } from "@/lib/ai/plan-chat/types";
import { readPlanChatSseStream } from "@/lib/chat/adapters/plan/parse-plan-chat-sse";
import type { ChatEvent } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type PlanChatClientError =
  | { kind: "http"; status: number; message: string }
  | { kind: "parse"; message: string };

export async function streamPlanChat(input: {
  body: PlanChatRequestBody;
  onEvent: (event: ChatEvent<WorkoutPlan>) => void;
}): Promise<PlanChatClientError | null> {
  const response = await fetch("/api/coach/plan-chat", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.body),
  });

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    try {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof (body as { message: unknown }).message === "string"
      ) {
        message = (body as { message: string }).message;
      }
    } catch {
      // use default message
    }
    return { kind: "http", status: response.status, message };
  }

  if (!response.body) {
    return { kind: "parse", message: "Empty response body." };
  }

  await readPlanChatSseStream(response.body, input.onEvent);
  return null;
}
