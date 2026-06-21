import { describe, expect, it } from "vitest";
import {
  DESKTOP_CHAT_AREA_CLASS,
  DESKTOP_CHAT_HEADER_CLASS,
  DESKTOP_CHAT_COLUMN_CLASS,
  DESKTOP_WORKSPACE_HEIGHT_CLASS,
} from "@/lib/coach/desktop-workspace-layout";

describe("desktop workspace layout classes", () => {
  it("defines full-height workspace panes", () => {
    expect(DESKTOP_WORKSPACE_HEIGHT_CLASS).toContain("h-full");
    expect(DESKTOP_WORKSPACE_HEIGHT_CLASS).toContain("min-h-0");
  });

  it("insets the full chat surface including the header", () => {
    expect(DESKTOP_CHAT_AREA_CLASS).toBe("p-4");
    expect(DESKTOP_CHAT_HEADER_CLASS).toContain("justify-end");
  });

  it("separates chat with a border and no top inset", () => {
    expect(DESKTOP_CHAT_COLUMN_CLASS).toContain("border-l");
    expect(DESKTOP_CHAT_COLUMN_CLASS).not.toContain("pt-");
  });

  it("defines a header row for the chat reset control", () => {
    expect(DESKTOP_CHAT_HEADER_CLASS).toContain("shrink-0");
    expect(DESKTOP_CHAT_HEADER_CLASS).toContain("justify-end");
  });
});
