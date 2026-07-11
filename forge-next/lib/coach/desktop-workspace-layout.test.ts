import { describe, expect, it } from "vitest";
import {
  DESKTOP_ARTIFACT_COLUMN_CLASS,
  DESKTOP_ARTIFACT_INNER_PADDING_CLASS,
  DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS,
  DESKTOP_CHAT_AREA_CLASS,
  DESKTOP_CHAT_COLLAPSED_RAIL_CLASS,
  DESKTOP_CHAT_COLLAPSED_WIDTH,
  DESKTOP_CHAT_GRID_TRANSITION_CLASS,
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

  it("defines a collapsed chat rail that matches the main sidebar width", () => {
    expect(DESKTOP_CHAT_COLLAPSED_WIDTH).toBe("3.5rem");
    expect(DESKTOP_CHAT_COLLAPSED_RAIL_CLASS).toContain("w-14");
    expect(DESKTOP_CHAT_GRID_TRANSITION_CLASS).toContain("duration-200");
    expect(DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS).toContain("67cqi");
    expect(DESKTOP_ARTIFACT_SPLIT_WIDTH_CLASS).toContain("mx-auto");
    expect(DESKTOP_ARTIFACT_COLUMN_CLASS).toContain("pt-4");
    expect(DESKTOP_ARTIFACT_COLUMN_CLASS).not.toContain("pb-");
    expect(DESKTOP_ARTIFACT_INNER_PADDING_CLASS).toContain("px-4");
  });
});
