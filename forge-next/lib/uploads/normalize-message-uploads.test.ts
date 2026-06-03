import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeCsvBuffer, makeXlsxBuffer } from "@/lib/uploads/__tests__/fixtures";

const mockSaveUploadContext = vi.fn();

vi.mock("@/lib/uploads/context-storage", () => ({
  saveUploadContext: (...args: unknown[]) => mockSaveUploadContext(...args),
}));

import { normalizeMessageUploads } from "@/lib/uploads/normalize-message-uploads";

describe("normalizeMessageUploads", () => {
  beforeEach(() => {
    mockSaveUploadContext.mockReset();
    mockSaveUploadContext.mockResolvedValue({
      ok: true,
      contextFileId: "coach-1/draft-1/plan.txt",
    });
  });

  it("normalizes CSV and persists to storage", async () => {
    const result = await normalizeMessageUploads({
      coachId: "coach-1",
      draftId: "draft-1",
      files: [{ filename: "plan.csv", buffer: makeCsvBuffer("a,b\n1,2") }],
    });

    expect(result).toEqual({
      ok: true,
      contextFileIds: ["coach-1/draft-1/plan.txt"],
    });
    expect(mockSaveUploadContext).toHaveBeenCalledOnce();
  });

  it("returns sheet clarification without persisting", async () => {
    const result = await normalizeMessageUploads({
      coachId: "coach-1",
      draftId: "draft-1",
      files: [
        {
          filename: "multi.xlsx",
          buffer: makeXlsxBuffer({
            Summary: [["1"]],
            Volume: [["2"]],
          }),
        },
      ],
      promptText: "no match",
    });

    expect(result).toEqual({
      ok: false,
      needsSheetClarification: true,
      sheets: ["Summary", "Volume"],
      filename: "multi.xlsx",
    });
    expect(mockSaveUploadContext).not.toHaveBeenCalled();
  });

  it("rejects a sixth file", async () => {
    const files = Array.from({ length: 6 }, (_, i) => ({
      filename: `f${i}.csv`,
      buffer: makeCsvBuffer("x"),
    }));
    const result = await normalizeMessageUploads({
      coachId: "coach-1",
      draftId: "draft-1",
      files,
    });
    expect(result).toMatchObject({ ok: false, error: "TOO_MANY_FILES" });
  });
});
