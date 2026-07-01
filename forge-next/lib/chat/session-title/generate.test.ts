import { describe, expect, it, vi } from "vitest";
import {
  SESSION_FALLBACK_TITLE,
  generateSessionTitleFromText,
  normalizeSessionTitle,
} from "@/lib/chat/session-title/generate";

const aiDeps = {
  isGatewayConfigured: () => true,
  generateTextFn: vi.fn().mockResolvedValue({ text: "Bench Press Block", content: [] }),
  createModel: () => "mock-model" as never,
};

describe("generateSessionTitleFromText", () => {
  it("returns a normalized model title", async () => {
    const title = await generateSessionTitleFromText(
      "Build a 4-week bench press plan",
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

    await generateSessionTitleFromText("what color is the sky", {
      isGatewayConfigured: () => true,
      generateTextFn,
      createModel: () => "mock-model" as never,
    });

    expect(generateTextFn).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: "user", content: "what color is the sky" }],
      }),
    );
  });

  it("reads text from content parts when text is empty", async () => {
    const title = await generateSessionTitleFromText("what color is the sky", {
      ...aiDeps,
      generateTextFn: vi.fn().mockResolvedValue({
        text: "",
        content: [{ type: "text", text: "Sky Appears Blue" }],
      }),
    });

    expect(title).toBe("Sky Appears Blue");
  });

  it("falls back for verbose meta responses", async () => {
    const title = await generateSessionTitleFromText("what color is the sky", {
      ...aiDeps,
      generateTextFn: vi.fn().mockResolvedValue({
        text: 'We need to summarize "What color is the sky?" in 3-4 words. A typical answer',
        content: [],
      }),
    });

    expect(title).toBe(SESSION_FALLBACK_TITLE);
  });

  it("falls back when gateway is unavailable", async () => {
    const title = await generateSessionTitleFromText("Build a plan", {
      isGatewayConfigured: () => false,
    });

    expect(title).toBe(SESSION_FALLBACK_TITLE);
  });

  it("falls back on api errors", async () => {
    const title = await generateSessionTitleFromText("Build a plan", {
      ...aiDeps,
      generateTextFn: vi.fn().mockRejectedValue(new Error("gateway down")),
    });

    expect(title).toBe(SESSION_FALLBACK_TITLE);
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
