import { describe, expect, it } from "vitest";
import {
  DESKTOP_CHAT_CLOSE_CLASS,
  DESKTOP_CHAT_COLUMN_CLASS,
  DESKTOP_WORKSPACE_HEIGHT_CLASS,
} from "@/lib/coach/desktop-workspace-layout";

describe("desktop workspace layout classes", () => {
  it("defines full-height workspace panes", () => {
    expect(DESKTOP_WORKSPACE_HEIGHT_CLASS).toContain("h-full");
    expect(DESKTOP_WORKSPACE_HEIGHT_CLASS).toContain("min-h-0");
  });

  it("separates chat with a border and no top inset", () => {
    expect(DESKTOP_CHAT_COLUMN_CLASS).toContain("border-l");
    expect(DESKTOP_CHAT_COLUMN_CLASS).not.toContain("pt-");
  });

  it("positions the chat close control without a header row", () => {
    expect(DESKTOP_CHAT_CLOSE_CLASS).toContain("absolute");
    expect(DESKTOP_CHAT_CLOSE_CLASS).toContain("top-0");
  });
});
