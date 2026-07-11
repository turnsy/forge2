import { describe, expect, it } from "vitest";
import { isTurnInProgress, shouldShowPreviewSpinner } from "@/lib/chat/turn-activity";

describe("turn activity", () => {
  it("treats active workspace phases as in progress", () => {
    expect(isTurnInProgress("streaming", null)).toBe(true);
    expect(isTurnInProgress("uploading", null)).toBe(true);
    expect(isTurnInProgress("initializing", null)).toBe(true);
  });

  it("treats active run statuses as in progress", () => {
    expect(isTurnInProgress("idle", "generating")).toBe(true);
    expect(isTurnInProgress("idle", "sandbox")).toBe(true);
  });

  it("treats terminal states as settled", () => {
    expect(isTurnInProgress("idle", null)).toBe(false);
    expect(isTurnInProgress("idle", "done")).toBe(false);
    expect(isTurnInProgress("error", "error")).toBe(false);
  });

  it("shows preview spinner for any active run status", () => {
    expect(shouldShowPreviewSpinner("generating")).toBe(true);
    expect(shouldShowPreviewSpinner("sandbox")).toBe(true);
    expect(shouldShowPreviewSpinner("done")).toBe(false);
    expect(shouldShowPreviewSpinner(null)).toBe(false);
  });
});
