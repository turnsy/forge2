import { SESSION_UPLOAD_READ_MAX_CHARS } from "./constants";
import { loadUploadContextById } from "@/lib/uploads/context-storage";
import { listSessionUploads } from "@/lib/uploads/list-session-uploads";

export function truncateSessionUploadText(text: string): {
  content: string;
  truncated: boolean;
} {
  if (text.length <= SESSION_UPLOAD_READ_MAX_CHARS) {
    return { content: text, truncated: false };
  }

  return {
    content: `${text.slice(0, SESSION_UPLOAD_READ_MAX_CHARS)}\n\n[truncated]`,
    truncated: true,
  };
}

export async function listForgeSessionUploadPaths(
  coachId: string,
  forgeSessionId: string,
): Promise<string[]> {
  const items = await listSessionUploads(coachId, forgeSessionId);
  return items.map((item) => item.path).filter((path) => path.length > 0);
}

export async function readForgeSessionUpload(
  coachId: string,
  path: string,
): Promise<
  | { ok: true; path: string; content: string; truncated: boolean }
  | { ok: false; error: "FILE_NOT_FOUND" }
> {
  const text = await loadUploadContextById(path, coachId);
  if (text === null) {
    return { ok: false, error: "FILE_NOT_FOUND" };
  }

  const { content, truncated } = truncateSessionUploadText(text);
  return { ok: true, path, content, truncated };
}
