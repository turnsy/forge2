import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadFileSlug } from "@/lib/uploads/file-utils";
import { UPLOAD_CSV_MAX_ROWS } from "@/lib/uploads/parse-upload";
import { makeCsvBuffer, makeXlsxBuffer } from "@/lib/uploads/__tests__/fixtures";

const mockSaveUploadContext = vi.fn();
const mockSaveUploadImage = vi.fn();

vi.mock("@/lib/uploads/context-storage", () => ({
  saveUploadImage: (...args: unknown[]) => mockSaveUploadImage(...args),
  saveUploadContext: (...args: unknown[]) => mockSaveUploadContext(...args),
}));

import { normalizeMessageUploads } from "@/lib/uploads/normalize-message-uploads";

describe("normalizeMessageUploads", () => {
  beforeEach(() => {
    mockSaveUploadContext.mockReset();
    mockSaveUploadContext.mockResolvedValue({
      ok: true,
      contextFileId: "coach-1/session-1/stored.txt",
    });
  });

  it("stores images intact without normalizing them to text", async () => {
    const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");
    mockSaveUploadImage.mockResolvedValue({ ok: true, contextFileId: "coach-1/session-1/photo.png" });
    const result = await normalizeMessageUploads({ coachId: "coach-1", sessionId: "session-1", files: [{ filename: "photo.png", buffer }] });
    expect(result).toEqual({ ok: true, contextFileIds: ["coach-1/session-1/photo.png"] });
    expect(mockSaveUploadImage).toHaveBeenCalledWith({ coachId: "coach-1", sessionId: "session-1", filename: "photo.png", buffer, mediaType: "image/png" });
    expect(mockSaveUploadContext).not.toHaveBeenCalled();
  });

  it("rejects a non-image renamed to png before storage", async () => {
    const result = await normalizeMessageUploads({ coachId: "c", sessionId: "s", files: [{ filename: "fake.png", buffer: Buffer.from("not an image") }] });
    expect(result).toMatchObject({ ok: false, error: "PARSE_FAILED" });
    expect(mockSaveUploadContext).not.toHaveBeenCalled();
  });

  it("normalizes CSV and persists to storage", async () => {
    mockSaveUploadContext.mockResolvedValueOnce({
      ok: true,
      contextFileId: "coach-1/session-1/plan.txt",
    });

    const result = await normalizeMessageUploads({
      coachId: "coach-1",
      sessionId: "session-1",
      files: [{ filename: "plan.csv", buffer: makeCsvBuffer("a,b\n1,2") }],
    });

    expect(result).toEqual({
      ok: true,
      contextFileIds: ["coach-1/session-1/plan.txt"],
    });
    expect(mockSaveUploadContext).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: uploadFileSlug("plan.csv"),
      }),
    );
  });

  it("persists every sheet for multi-sheet XLSX without clarification", async () => {
    mockSaveUploadContext
      .mockResolvedValueOnce({
        ok: true,
        contextFileId: "coach-1/session-1/workbook__summary.txt",
      })
      .mockResolvedValueOnce({
        ok: true,
        contextFileId: "coach-1/session-1/workbook__volume.txt",
      });

    const result = await normalizeMessageUploads({
      coachId: "coach-1",
      sessionId: "session-1",
      files: [
        {
          filename: "workbook.xlsx",
          buffer: makeXlsxBuffer({
            Summary: [["1"]],
            Volume: [["2"]],
          }),
        },
      ],
    });

    expect(result).toEqual({
      ok: true,
      contextFileIds: [
        "coach-1/session-1/workbook__summary.txt",
        "coach-1/session-1/workbook__volume.txt",
      ],
    });
    expect(mockSaveUploadContext).toHaveBeenCalledTimes(2);
    expect(mockSaveUploadContext).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: uploadFileSlug("workbook.xlsx", "Summary"),
      }),
    );
  });

  it("propagates CSV truncation warnings on success", async () => {
    mockSaveUploadContext.mockResolvedValueOnce({
      ok: true,
      contextFileId: "coach-1/session-1/big.txt",
    });

    const rows = Array.from(
      { length: UPLOAD_CSV_MAX_ROWS + 5 },
      (_, i) => `row${i},value`,
    );
    const result = await normalizeMessageUploads({
      coachId: "coach-1",
      sessionId: "session-1",
      files: [{ filename: "big.csv", buffer: makeCsvBuffer(rows.join("\n")) }],
    });

    expect(result).toMatchObject({
      ok: true,
      contextFileIds: ["coach-1/session-1/big.txt"],
      warnings: [{ code: "CSV_TRUNCATED" }],
    });
  });

  it("rejects a sixth file", async () => {
    const files = Array.from({ length: 6 }, (_, i) => ({
      filename: `f${i}.csv`,
      buffer: makeCsvBuffer("x"),
    }));
    const result = await normalizeMessageUploads({
      coachId: "coach-1",
      sessionId: "session-1",
      files,
    });
    expect(result).toMatchObject({ ok: false, error: "TOO_MANY_FILES" });
  });
});
