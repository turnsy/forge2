import { describe, expect, it } from "vitest";
import { hasVisibleChatContent } from "@/lib/chat/message-content";

describe("hasVisibleChatContent", () => {
  it("returns false for whitespace-only content", () => {
    expect(hasVisibleChatContent("")).toBe(false);
    expect(hasVisibleChatContent("   ")).toBe(false);
    expect(hasVisibleChatContent("\n\t")).toBe(false);
  });

  it("returns true when trimmed content exists", () => {
    expect(hasVisibleChatContent("Hello")).toBe(true);
    expect(hasVisibleChatContent("  Hi  ")).toBe(true);
  });
});
