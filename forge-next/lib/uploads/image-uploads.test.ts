import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { imageMediaType, matchesImageType } from "@/lib/uploads/image-types";
import { UPLOAD_IMAGE_MAX_BYTES } from "@/lib/uploads/limits";
import { validateMessageUploadBatch } from "@/lib/uploads/validate-batch";

vi.mock("@/utils/supabase/data-client", () => ({ createClient: vi.fn() }));
import { saveUploadImage, saveUploadContext, loadUploadImageById } from "@/lib/uploads/context-storage";

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64");

describe("image uploads", () => {
  it.each(["photo.png", "photo.JPG", "photo.jpeg", "photo.webp", "photo.gif"])("allows %s within image limits", (filename) => {
    expect(imageMediaType(filename)).toMatch(/^image\//);
    expect(validateMessageUploadBatch([{ filename, buffer: png }])).toEqual({ ok: true });
  });

  it.each([
    ["image/png", [137, 80, 78, 71, 13, 10, 26, 10]],
    ["image/jpeg", [255, 216, 255, 224]],
    ["image/gif", [71, 73, 70, 56, 55, 97]],
    ["image/gif", [71, 73, 70, 56, 57, 97]],
    ["image/webp", [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]],
  ])("checks the signature for %s", (mediaType, bytes) => {
    expect(matchesImageType(new Uint8Array(bytes), mediaType)).toBe(true);
    expect(matchesImageType(new Uint8Array(bytes.slice(0, 2)), mediaType)).toBe(false);
  });

  it("rejects oversized images and unsupported image formats", () => {
    expect(validateMessageUploadBatch([{ filename: "big.png", buffer: Buffer.alloc(UPLOAD_IMAGE_MAX_BYTES + 1) }])).toMatchObject({ ok: false, error: "FILE_TOO_LARGE" });
    expect(imageMediaType("image.svg")).toBeNull();
    expect(matchesImageType(Buffer.from("pretend png"), "image/png")).toBe(false);
    expect(matchesImageType(png, "image/png")).toBe(true);
  });

  it("stores original bytes with an image content type and unique paths in the thread bucket", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn(() => ({ upload }));
    const client = { storage: { from } } as unknown as SupabaseClient;
    const input = { coachId: "coach", sessionId: "thread", filename: "plan.png", buffer: png, mediaType: "image/png" };
    const first = await saveUploadImage(input, client);
    const second = await saveUploadImage(input, client);
    expect(from).toHaveBeenCalledWith("session-uploads");
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^coach\/thread\/plan-.*\.png$/), png, { contentType: "image/png", upsert: false });
    expect(first.ok && second.ok && first.contextFileId !== second.contextFileId).toBe(true);
  });

  it("also preserves distinct versions of same-named text uploads", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const client = { storage: { from: () => ({ upload }) } } as unknown as SupabaseClient;
    const input = { coachId: "coach", sessionId: "thread", slug: "plan", normalizedText: "source" };
    const first = await saveUploadContext(input, client);
    const second = await saveUploadContext(input, client);
    expect(first.ok && second.ok && first.contextFileId !== second.contextFileId).toBe(true);
    expect(upload).toHaveBeenCalledWith(expect.stringMatching(/^coach\/thread\/plan-.*\.txt$/), expect.any(Buffer), expect.objectContaining({ upsert: false }));
  });

  it("rejects cross-coach and traversal reads before touching storage", async () => {
    const from = vi.fn();
    const client = { storage: { from } } as unknown as SupabaseClient;
    expect(await loadUploadImageById("other/thread/photo.png", "coach", client)).toBeNull();
    expect(await loadUploadImageById("coach/../other/photo.png", "coach", client)).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });
});
