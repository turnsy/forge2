import type { UploadContextResult } from "@/lib/uploads/types";

export async function uploadContextFile(input: {
  sessionId: string;
  file: File;
}): Promise<UploadContextResult> {
  const formData = new FormData();
  formData.set("sessionId", input.sessionId);
  formData.append("files[]", input.file);

  const response = await fetch("/api/coach/upload-context", {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });

  const body: unknown = await response.json();
  if (
    typeof body === "object" &&
    body !== null &&
    "ok" in body &&
    typeof (body as { ok: unknown }).ok === "boolean"
  ) {
    return body as UploadContextResult;
  }

  return {
    ok: false,
    error: "PARSE_FAILED",
    message: "Unexpected upload response.",
  };
}
