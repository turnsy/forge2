import { describe, expect, it, vi } from "vitest";
import {
  SESSION_FALLBACK_TITLE,
  generateSessionTitle,
  generateSessionTitleWithResult,
  normalizeSessionTitle,
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
  generateTextFn: vi.fn().mockResolvedValue({ text: "Bench Press Block", content: [] }),
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
        generateTextFn: vi.fn().mockResolvedValue({
          text: '"Bench Press Block"',
          content: [],
        }),
      },
    );

    expect(title).toBe("Bench Press Block");
  });

  it("passes the raw first message as the user turn", async () => {
    const generateTextFn = vi
      .fn()
      .mockResolvedValue({ text: "Sky Color Question", content: [] });

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
        messages: [{ role: "user", content: "what color is the sky" }],
      }),
    );
  });

  it("reads text from content parts when text is empty", async () => {
    const title = await generateSessionTitle(
      snapshot({
        messages: [{ role: "user", content: "what color is the sky" }],
      }),
      {
        ...aiDeps,
        generateTextFn: vi.fn().mockResolvedValue({
          text: "",
          content: [{ type: "text", text: "Sky Appears Blue" }],
        }),
      },
    );

    expect(title).toBe("Sky Appears Blue");
  });

  it("rejects verbose meta responses", async () => {
    await expect(
      generateSessionTitleWithResult(
        snapshot({
          messages: [{ role: "user", content: "what color is the sky" }],
        }),
        {
          ...aiDeps,
          generateTextFn: vi.fn().mockResolvedValue({
            text: 'We need to summarize "What color is the sky?" in 3-4 words. A typical answer',
            content: [],
          }),
        },
      ),
    ).resolves.toEqual({
      ok: false,
      reason: "invalid_model_output",
      detail:
        'We need to summarize "What color is the sky?" in 3-4 words. A typical answer',
    });
  });

  it("falls back when gateway is unavailable", async () => {
    await expect(
      generateSessionTitleWithResult(
        snapshot({
          messages: [{ role: "user", content: "Build a plan" }],
        }),
        { isGatewayConfigured: () => false },
      ),
    ).resolves.toEqual({ ok: false, reason: "gateway_unconfigured" });
  });

  it("reports api errors", async () => {
    await expect(
      generateSessionTitleWithResult(
        snapshot({
          messages: [{ role: "user", content: "Build a plan" }],
        }),
        {
          ...aiDeps,
          generateTextFn: vi.fn().mockRejectedValue(new Error("gateway down")),
        },
      ),
    ).resolves.toEqual({
      ok: false,
      reason: "api_error",
      detail: "gateway down",
    });
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
});

describe("normalizeSessionTitle", () => {
  it("strips wrapping quotes and trailing punctuation", () => {
    expect(normalizeSessionTitle('"Hypertrophy Block."')).toBe("Hypertrophy Block");
  });

  it("limits titles to four words", () => {
    expect(
      normalizeSessionTitle("Build A Four Week Strength Block"),
    ).toBe("Build A Four Week");
  });
});
