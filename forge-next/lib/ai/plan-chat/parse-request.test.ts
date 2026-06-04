import { describe, expect, it } from "vitest";
import { parsePlanChatRequestBody } from "@/lib/ai/plan-chat/parse-request";

describe("parsePlanChatRequestBody", () => {
  it("requires a non-empty prompt", () => {
    expect(parsePlanChatRequestBody({ prompt: "  " }).ok).toBe(false);
  });

  it("accepts a minimal valid body", () => {
    const parsed = parsePlanChatRequestBody({ prompt: "Build a plan" });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.prompt).toBe("Build a plan");
      expect(parsed.currentArtifact).toBeNull();
    }
  });

  it("rejects invalid currentArtifact", () => {
    const parsed = parsePlanChatRequestBody({
      prompt: "x",
      currentArtifact: { schemaVersion: "1.0.0" },
    });
    expect(parsed.ok).toBe(false);
  });
});
