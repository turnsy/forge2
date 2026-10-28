import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateText, loadUploadImageById, loadUploadContextById } = vi.hoisted(() => ({
  generateText: vi.fn(), loadUploadImageById: vi.fn(), loadUploadContextById: vi.fn(),
}));
vi.mock("ai", () => ({ generateText }));
vi.mock("@/lib/uploads/context-storage", () => ({ loadUploadImageById, loadUploadContextById }));
vi.mock("@/lib/uploads/list-session-uploads", () => ({ listSessionUploads: vi.fn() }));
import { readForgeSessionUpload } from "./uploads";

describe("readForgeSessionUpload", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the original image with vision only when requested", async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]);
    loadUploadImageById.mockResolvedValue(new Blob([bytes], { type: "image/png" }));
    generateText.mockResolvedValue({ text: "Squat: 3 sets of 5 at 100 kg" });
    expect(await readForgeSessionUpload("coach", "coach/thread/plan.png")).toEqual({ ok: true, path: "coach/thread/plan.png", content: "Squat: 3 sets of 5 at 100 kg", truncated: false });
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({ messages: [{ role: "user", content: [
      { type: "text", text: "Read this attached image." },
      { type: "image", image: bytes, mediaType: "image/png" },
    ] }] }));
    expect(loadUploadContextById).not.toHaveBeenCalled();
  });

  it("does not call vision for an inaccessible image", async () => {
    loadUploadImageById.mockResolvedValue(null);
    expect(await readForgeSessionUpload("coach", "other/thread/plan.png")).toEqual({ ok: false, error: "FILE_NOT_FOUND" });
    expect(generateText).not.toHaveBeenCalled();
  });

  it("keeps normalized text reads unchanged", async () => {
    loadUploadContextById.mockResolvedValue("Squat,3,5");
    expect(await readForgeSessionUpload("coach", "coach/thread/plan.txt")).toMatchObject({ ok: true, content: "Squat,3,5" });
    expect(generateText).not.toHaveBeenCalled();
  });
});
