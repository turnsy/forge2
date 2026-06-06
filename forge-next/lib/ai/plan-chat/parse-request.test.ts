import { describe, expect, it } from "vitest";
import { parsePlanChatRequestBody } from "@/lib/ai/plan-chat/parse-request";

describe("parsePlanChatRequestBody", () => {
  it("requires sessionId", () => {
    expect(parsePlanChatRequestBody({ prompt: "Build a plan" }).ok).toBe(false);
    expect(parsePlanChatRequestBody({ sessionId: "  ", prompt: "x" }).ok).toBe(
      false,
    );
  });

  it("requires a non-empty prompt", () => {
    expect(
      parsePlanChatRequestBody({ sessionId: "s-1", prompt: "  " }).ok,
    ).toBe(false);
  });

  it("accepts a minimal valid body", () => {
    const parsed = parsePlanChatRequestBody({
      sessionId: "s-1",
      prompt: "Build a plan",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.sessionId).toBe("s-1");
      expect(parsed.prompt).toBe("Build a plan");
      expect(parsed.currentArtifact).toBeNull();
    }
  });

  it("rejects invalid currentArtifact", () => {
    const parsed = parsePlanChatRequestBody({
      sessionId: "s-1",
      prompt: "x",
      currentArtifact: { schemaVersion: "1.0.0" },
    });
    expect(parsed.ok).toBe(false);
  });
});
