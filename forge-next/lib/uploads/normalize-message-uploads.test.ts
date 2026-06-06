import { beforeEach, describe, expect, it, vi } from "vitest";
import { draftUploadSlug } from "@/lib/uploads/file-utils";
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
      contextFileId: "coach-1/session-1/stored.txt",
    });
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
        slug: draftUploadSlug("plan.csv"),
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
        slug: draftUploadSlug("workbook.xlsx", "Summary"),
      }),
    );
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
