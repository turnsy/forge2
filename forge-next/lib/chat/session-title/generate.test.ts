import { describe, expect, it, vi } from "vitest";
import {
  SESSION_FALLBACK_TITLE,
  buildSessionTitlePrompt,
  generateSessionTitle,
  shouldGenerateSessionTitle,
} from "@/lib/chat/session-title/generate";
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

  it("embeds the first user message in the title prompt", async () => {
    const generateTextFn = vi
      .fn()
      .mockResolvedValue({ text: "Sky Color Question" });

    await generateSessionTitle(
      snapshot({
        messages: [
          { role: "user", content: "what color is the sky" },
          { role: "assistant", content: "Blue." },
        ],
      }),
      {
        isGatewayConfigured: () => true,
        generateTextFn,
        createModel: () => "mock-model" as never,
      },
    );

    expect(generateTextFn).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: buildSessionTitlePrompt("what color is the sky"),
      }),
    );
  });

  it("rejects prompt-echo titles", async () => {
    const title = await generateSessionTitle(
      snapshot({
        messages: [{ role: "user", content: "what color is the sky" }],
      }),
      {
        ...aiDeps,
        generateTextFn: vi.fn().mockResolvedValue({
          text: "Summarize the following in 3-4 words",
        }),
      },
    );

    expect(title).toBe(SESSION_FALLBACK_TITLE);
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

describe("shouldGenerateSessionTitle", () => {
  it("is true only for the first user message on main saves", () => {
    expect(
      shouldGenerateSessionTitle(
        snapshot({
          messages: [
            { role: "user", content: "Build a plan" },
            { role: "assistant", content: "Sure." },
          ],
        }),
        { generateTitle: true },
      ),
    ).toBe(true);
  });

  it("is false for beacon saves", () => {
    expect(
      shouldGenerateSessionTitle(
        snapshot({
          messages: [{ role: "user", content: "Build a plan" }],
        }),
        { generateTitle: false },
      ),
    ).toBe(false);
  });

  it("is false after the first user message", () => {
    expect(
      shouldGenerateSessionTitle(
        snapshot({
          messages: [
            { role: "user", content: "First" },
            { role: "assistant", content: "Hi" },
            { role: "user", content: "Second" },
          ],
        }),
        { generateTitle: true },
      ),
    ).toBe(false);
  });
});
