/**
 * Ephemeral normalized upload text in Supabase Storage.
 * Implementation: Phase 2 (upload normalization).
 */

export type ContextFileId = string;

export type SaveUploadContextInput = {
  coachId: string;
  draftId: string;
  filename: string;
  normalizedText: string;
};

export type SaveUploadContextResult =
  | { ok: true; contextFileId: ContextFileId }
  | { ok: false; code: "STORAGE_FAILED"; message: string };

/** Persist normalized upload text; returns a stable id for plan-chat. */
export async function saveUploadContext(
  _input: SaveUploadContextInput,
): Promise<SaveUploadContextResult> {
  throw new Error("saveUploadContext is not implemented (Phase 2)");
}

/** Load normalized text by id for Gateway prompt assembly. */
export async function loadUploadContextById(
  _contextFileId: ContextFileId,
): Promise<string | null> {
  throw new Error("loadUploadContextById is not implemented (Phase 2)");
}

/** Delete ephemeral objects after a plan-chat run (or TTL janitor). */
export async function deleteUploadContext(
  _contextFileIds: ContextFileId[],
): Promise<void> {
  throw new Error("deleteUploadContext is not implemented (Phase 2)");
}
