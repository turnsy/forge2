import { normalizeMessageUploads } from "@/lib/uploads/normalize-message-uploads";
import type { MessageUploadFile, UploadContextResult } from "@/lib/uploads/types";

export async function handleUploadContextFormData(
  coachId: string,
  formData: FormData,
): Promise<UploadContextResult> {
  const draftId = formData.get("draftId");
  if (typeof draftId !== "string" || !draftId.trim()) {
    return {
      ok: false,
      error: "PARSE_FAILED",
      message: "draftId is required.",
    };
  }

  const fileEntries = [
    ...formData.getAll("files"),
    ...formData.getAll("files[]"),
  ];

  if (fileEntries.length === 0) {
    return {
      ok: false,
      error: "PARSE_FAILED",
      message: "At least one file is required.",
    };
  }

  const files: MessageUploadFile[] = [];

  for (const entry of fileEntries) {
    if (!(entry instanceof File)) {
      continue;
    }

    const buffer = Buffer.from(await entry.arrayBuffer());
    files.push({
      filename: entry.name || "upload",
      buffer,
      mimeType: entry.type || undefined,
    });
  }

  if (files.length === 0) {
    return {
      ok: false,
      error: "PARSE_FAILED",
      message: "No valid files were uploaded.",
    };
  }

  return normalizeMessageUploads({
    coachId,
    draftId: draftId.trim(),
    files,
  });
}
