import { describe, expect, it } from "vitest";
import { formatAttachmentDisplayLabel } from "@/lib/chat/utils";

describe("formatAttachmentDisplayLabel", () => {
  it("returns the filename for a single context file", () => {
    expect(formatAttachmentDisplayLabel("program.xlsx", 1)).toBe("program.xlsx");
  });

  it("annotates multi-sheet workbooks", () => {
    expect(formatAttachmentDisplayLabel("program.xlsx", 3)).toBe(
      "program.xlsx (3 sheets)",
    );
  });
});
