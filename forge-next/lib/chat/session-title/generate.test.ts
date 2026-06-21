import { describe, expect, it, vi } from "vitest";
import {
  deriveFallbackSessionTitle,
  formatConversationForTitle,
  formatMessageForTitle,
  generateSessionTitle,
  hasAssistantReply,
  normalizeSessionTitle,
  resolveSessionTitle,
} from "@/lib/chat/session-title";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";

function snapshot(
  overrides: Partial<ChatSessionSnapshot> = {},
): ChatSessionSnapshot {
  return {
    title: null,
    messages: [],
    currentArtifact: null,
    planId: null,
    artifactTitle: "",
    contextFileIds: [],
    ...overrides,
  };
}

describe("formatMessageForTitle", () => {
  it("uses mention labels from segments", () => {
    expect(
      formatMessageForTitle({
        role: "user",
        content: "Update @Summer Block",
        segments: [
          { type: "text", value: "Update " },
          { type: "mention", id: "p1", label: "Summer Block", kind: "plan" },
        ],
      }),
    ).toBe("Update Summer Block");
  });
});

describe("deriveFallbackSessionTitle", () => {
  it("prefers artifact title", () => {
    expect(
      deriveFallbackSessionTitle(
        snapshot({
          artifactTitle: "4-Week Strength Block",
          messages: [{ role: "user", content: "Build something else" }],
        }),
      ),
    ).toBe("4-Week Strength Block");
  });

  it("falls back to the first user message", () => {
    expect(
      deriveFallbackSessionTitle(
        snapshot({
          messages: [{ role: "user", content: "Build a hypertrophy block" }],
        }),
      ),
    ).toBe("Build a hypertrophy block");
  });
});

describe("generateSessionTitle", () => {
  it("returns a normalized model title", async () => {
    const title = await generateSessionTitle(
      snapshot({
        messages: [
          { role: "user", content: "Build a 4-week bench press plan" },
          { role: "assistant", content: "I can help with that." },
        ],
      }),
      {
        isGatewayConfigured: () => true,
        generateTextFn: vi.fn().mockResolvedValue({ text: '"Bench Press Block"' }),
        createModel: () => "mock-model" as never,
      },
    );

    expect(title).toBe("Bench Press Block");
  });

  it("falls back when gateway is unavailable", async () => {
    const title = await generateSessionTitle(
      snapshot({
        messages: [{ role: "user", content: "Build a plan" }],
      }),
      { isGatewayConfigured: () => false },
    );

    expect(title).toBe("Build a plan");
  });
});

describe("resolveSessionTitle", () => {
  it("preserves an existing stored title", async () => {
    await expect(
      resolveSessionTitle(
        snapshot({ messages: [{ role: "user", content: "New prompt" }] }),
        "Existing title",
      ),
    ).resolves.toBe("Existing title");
  });

  it("uses fallback when AI generation is disabled", async () => {
    await expect(
      resolveSessionTitle(
        snapshot({
          messages: [
            { role: "user", content: "Build a plan" },
            { role: "assistant", content: "Sure." },
          ],
        }),
        null,
        { generateTitle: false },
      ),
    ).resolves.toBe("Build a plan");
  });
});

describe("formatConversationForTitle", () => {
  it("includes recent messages and artifact title", () => {
    expect(
      formatConversationForTitle(
        snapshot({
          artifactTitle: "Summer Block",
          messages: [
            { role: "user", content: "Add a deload week" },
            { role: "assistant", content: "Done." },
          ],
        }),
      ),
    ).toBe(
      "Coach: Add a deload week\nAssistant: Done.\nPlan title: Summer Block",
    );
  });
});

describe("normalizeSessionTitle", () => {
  it("strips wrapping quotes and trailing punctuation", () => {
    expect(normalizeSessionTitle('"Hypertrophy Block."')).toBe("Hypertrophy Block");
  });
});

describe("hasAssistantReply", () => {
  it("detects assistant messages", () => {
    expect(
      hasAssistantReply(
        snapshot({
          messages: [
            { role: "user", content: "Hi" },
            { role: "assistant", content: "Hello" },
          ],
        }),
      ),
    ).toBe(true);
  });
});
