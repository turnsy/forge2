import { describe, expect, it, vi } from "vitest";
import {
  SESSION_FALLBACK_TITLE,
  countUserMessages,
  formatConversationForTitle,
  formatMessageForTitle,
  generateSessionTitle,
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

const aiDeps = {
  isGatewayConfigured: () => true,
  generateTextFn: vi.fn().mockResolvedValue({ text: "Bench Press Block" }),
  createModel: () => "mock-model" as never,
};

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

describe("countUserMessages", () => {
  it("counts only user messages", () => {
    expect(
      countUserMessages(
        snapshot({
          messages: [
            { role: "user", content: "Hi" },
            { role: "assistant", content: "Hello" },
            { role: "user", content: "Again" },
          ],
        }),
      ),
    ).toBe(2);
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
        ...aiDeps,
        generateTextFn: vi.fn().mockResolvedValue({ text: '"Bench Press Block"' }),
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

    expect(title).toBe(SESSION_FALLBACK_TITLE);
  });
});

describe("resolveSessionTitle", () => {
  it("preserves an existing stored title", async () => {
    await expect(
      resolveSessionTitle(
        snapshot({ messages: [{ role: "user", content: "New prompt" }] }),
        "Existing title",
        { generateTitle: true },
      ),
    ).resolves.toBe("Existing title");
  });

  it("does not write a title on beacon saves", async () => {
    await expect(
      resolveSessionTitle(
        snapshot({
          messages: [{ role: "user", content: "Build a plan" }],
        }),
        null,
        { generateTitle: false },
      ),
    ).resolves.toBeNull();
  });

  it("generates an AI title once after the first user message", async () => {
    await expect(
      resolveSessionTitle(
        snapshot({
          messages: [
            { role: "user", content: "Build a 4-week bench press plan" },
            { role: "assistant", content: "I can help with that." },
          ],
        }),
        null,
        { generateTitle: true },
        aiDeps,
      ),
    ).resolves.toBe("Bench Press Block");
  });

  it("uses the fallback title after the first message window", async () => {
    await expect(
      resolveSessionTitle(
        snapshot({
          messages: [
            { role: "user", content: "First" },
            { role: "assistant", content: "Hi" },
            { role: "user", content: "Second" },
          ],
        }),
        null,
        { generateTitle: true },
        aiDeps,
      ),
    ).resolves.toBe(SESSION_FALLBACK_TITLE);
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
