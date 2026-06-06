import { normalizeMessageUploads } from "@/lib/uploads/normalize-message-uploads";
import type { MessageUploadFile, UploadContextResult } from "@/lib/uploads/types";

export async function handleUploadContextFormData(
  coachId: string,
  formData: FormData,
): Promise<UploadContextResult> {
  const sessionId = formData.get("sessionId");
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return {
      ok: false,
      error: "PARSE_FAILED",
      message: "sessionId is required.",
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
    sessionId: sessionId.trim(),
    files,
  });
}
