import { describe, expect, it } from "vitest";
import { handleUploadContextFormData } from "@/lib/uploads/upload-context-handler";

describe("handleUploadContextFormData", () => {
  it("returns PARSE_FAILED when sessionId is missing", async () => {
    const form = new FormData();
    form.append("files", new File(["a"], "a.csv", { type: "text/csv" }));

    const result = await handleUploadContextFormData("coach-1", form);

    expect(result).toEqual({
      ok: false,
      error: "PARSE_FAILED",
      message: "sessionId is required.",
    });
  });

  it("returns PARSE_FAILED when no files are provided", async () => {
    const form = new FormData();
    form.set("sessionId", "session-1");

    const result = await handleUploadContextFormData("coach-1", form);

    expect(result).toEqual({
      ok: false,
      error: "PARSE_FAILED",
      message: "At least one file is required.",
    });
  });
});
