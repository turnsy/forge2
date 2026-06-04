import { describe, expect, it } from "vitest";
import { encodePlanChatSseEvent } from "@/lib/ai/plan-chat/events";

describe("encodePlanChatSseEvent", () => {
  it("encodes JSON as SSE data lines", () => {
    const encoded = encodePlanChatSseEvent({
      type: "runStatus",
      status: "generating",
    });
    expect(encoded).toBe('data: {"type":"runStatus","status":"generating"}\n\n');
  });
});
