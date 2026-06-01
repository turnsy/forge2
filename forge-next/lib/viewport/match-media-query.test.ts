import { describe, expect, it } from "vitest";
import {
  desktopMediaQuery,
  isDesktopWidth,
  matchesMinWidth,
} from "@/lib/viewport/match-media-query";

describe("match-media-query", () => {
  it("matches when width meets minimum", () => {
    expect(matchesMinWidth(768, 768)).toBe(true);
    expect(matchesMinWidth(1024, 768)).toBe(true);
    expect(matchesMinWidth(767, 768)).toBe(false);
  });

  it("builds desktop media query string", () => {
    expect(desktopMediaQuery()).toBe("(min-width: 768px)");
    expect(desktopMediaQuery(1024)).toBe("(min-width: 1024px)");
  });

  it("detects desktop width", () => {
    expect(isDesktopWidth(768)).toBe(true);
    expect(isDesktopWidth(375)).toBe(false);
  });
});
