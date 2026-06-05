import { describe, expect, it } from "vitest";
import {
  getRunStatusLabel,
  shouldShowPreviewSpinner,
} from "@/lib/plan-chat/run-status-copy";

describe("run-status-copy", () => {
  it("maps run statuses to labels", () => {
    expect(getRunStatusLabel("sandbox")).toBe("Running plan builder");
    expect(getRunStatusLabel("validating")).toBe("Validating plan");
  });

  it("shows preview spinner only for sandbox and validating", () => {
    expect(shouldShowPreviewSpinner("sandbox")).toBe(true);
    expect(shouldShowPreviewSpinner("validating")).toBe(true);
    expect(shouldShowPreviewSpinner("generating")).toBe(false);
    expect(shouldShowPreviewSpinner(null)).toBe(false);
  });
});
