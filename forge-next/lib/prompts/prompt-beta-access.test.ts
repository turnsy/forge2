import { describe, expect, it } from "vitest";
import { isPromptBetaEnabled } from "@/lib/prompts/prompt-beta-access";

describe("isPromptBetaEnabled", () => {
  it("allows listed emails case-insensitively", () => {
    expect(isPromptBetaEnabled("jayturnsek@gmail.com")).toBe(true);
    expect(isPromptBetaEnabled("JayTurnsek@Gmail.com")).toBe(true);
    expect(isPromptBetaEnabled("masonmcgriskin19@gmail.com")).toBe(true);
  });

  it("denies unlisted or missing emails", () => {
    expect(isPromptBetaEnabled("other@example.com")).toBe(false);
    expect(isPromptBetaEnabled(undefined)).toBe(false);
    expect(isPromptBetaEnabled("")).toBe(false);
  });
});
