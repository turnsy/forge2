import { describe, expect, it } from "vitest";
import { UPLOAD_MAX_FILES_PER_MESSAGE } from "@/lib/uploads/limits";
import { validateMessageUploadBatch } from "@/lib/uploads/validate-batch";

describe("validateMessageUploadBatch", () => {
  it("rejects more than five files", () => {
    const files = Array.from({ length: UPLOAD_MAX_FILES_PER_MESSAGE + 1 }, (_, i) => ({
      filename: `f${i}.csv`,
      buffer: Buffer.from("a"),
    }));
    const result = validateMessageUploadBatch(files);
    expect(result).toEqual({
      ok: false,
      error: "TOO_MANY_FILES",
      message: expect.stringContaining("5"),
    });
  });

  it("rejects oversize CSV files", () => {
    const result = validateMessageUploadBatch([
      {
        filename: "huge.csv",
        buffer: Buffer.alloc(3 * 1024 * 1024),
      },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("FILE_TOO_LARGE");
    }
  });

  it("rejects unsupported extensions", () => {
    const result = validateMessageUploadBatch([
      { filename: "bad.exe", buffer: Buffer.from("x") },
    ]);
    expect(result).toMatchObject({
      ok: false,
      error: "UNSUPPORTED_TYPE",
    });
  });
});
