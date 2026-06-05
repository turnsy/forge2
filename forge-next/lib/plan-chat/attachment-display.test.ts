import { describe, expect, it } from "vitest";
import { formatAttachmentDisplayLabel } from "@/lib/plan-chat/attachment-display";

describe("formatAttachmentDisplayLabel", () => {
  it("returns the filename for a single context file", () => {
    expect(formatAttachmentDisplayLabel("plan.csv", 1)).toBe("plan.csv");
  });

  it("labels multi-sheet workbooks", () => {
    expect(formatAttachmentDisplayLabel("export.xlsx", 3)).toBe(
      "export.xlsx (3 sheets)",
    );
  });
});
