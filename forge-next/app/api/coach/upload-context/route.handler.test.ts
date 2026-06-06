import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeXlsxBuffer } from "@/lib/uploads/__tests__/fixtures";

const mockRequireApiRole = vi.fn();
const mockSaveUploadContext = vi.fn();

vi.mock("@/lib/auth/api", () => ({
  requireApiRole: (...args: unknown[]) => mockRequireApiRole(...args),
}));

vi.mock("@/lib/uploads/context-storage", () => ({
  saveUploadContext: (...args: unknown[]) => mockSaveUploadContext(...args),
}));

import { POST } from "@/app/api/coach/upload-context/route";

describe("POST /api/coach/upload-context (handler integration)", () => {
  beforeEach(() => {
    mockRequireApiRole.mockReset();
    mockSaveUploadContext.mockReset();
    mockRequireApiRole.mockResolvedValue({
      ok: true,
      user: { id: "coach-1", role: "coach", email: "c@x.com", fullName: null },
    });
  });

  it("returns multiple context file ids for multi-sheet XLSX", async () => {
    mockSaveUploadContext
      .mockResolvedValueOnce({
        ok: true,
        contextFileId: "coach-1/session-1/workbook__summary.txt",
      })
      .mockResolvedValueOnce({
        ok: true,
        contextFileId: "coach-1/session-1/workbook__volume.txt",
      });

    const form = new FormData();
    form.set("sessionId", "session-1");
    form.append(
      "files[]",
      new File(
        [makeXlsxBuffer({ Summary: [["a"]], Volume: [["b"]] })],
        "workbook.xlsx",
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ),
    );

    const response = await POST(
      new Request("http://localhost/api/coach/upload-context", {
        method: "POST",
        body: form,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      contextFileIds: [
        "coach-1/session-1/workbook__summary.txt",
        "coach-1/session-1/workbook__volume.txt",
      ],
    });
    expect(mockSaveUploadContext).toHaveBeenCalledTimes(2);
  });
});
