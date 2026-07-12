import { describe, expect, it } from "vitest";
import {
  buildNoSessionUploadsInstructions,
  buildSessionUploadsPresentInstructions,
} from "@/agent/lib/session-upload-instructions";

describe("session upload instructions", () => {
  it("describes prompt-only plans when no uploads exist", () => {
    expect(buildNoSessionUploadsInstructions()).toContain("prompt-only plans");
  });

  it("tells the agent to read uploads before plan codegen", () => {
    const markdown = buildSessionUploadsPresentInstructions([
      "coach-1/session-1/my-plan.txt",
      "coach-1/session-1/workbook__summary.txt",
    ]);

    expect(markdown).toContain("coach-1/session-1/my-plan.txt");
    expect(markdown).toContain("read_session_file");
    expect(markdown).toContain("from this");
    expect(markdown).toContain("ask which sheet");
  });
});
