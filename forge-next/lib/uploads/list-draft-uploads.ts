import { createClient } from "@/utils/supabase/server";
import {
  DRAFT_UPLOADS_BUCKET,
  draftUploadPrefix,
} from "@/lib/uploads/storage-paths";
import type { SupabaseClient } from "@supabase/supabase-js";

export type DraftUploadListItem = {
  /** Storage object path (same as contextFileId). */
  path: string;
  name: string;
  sizeBytes: number | null;
};

type StorageSupabaseClient = SupabaseClient;

/**
 * List normalized upload objects for a draft workspace.
 * Used by plan-chat tools (Phase 3); not exposed to the browser directly.
 */
export async function listDraftUploads(
  coachId: string,
  draftId: string,
  client?: StorageSupabaseClient,
): Promise<DraftUploadListItem[]> {
  const supabase = client ?? (await createClient());
  const prefix = draftUploadPrefix(coachId, draftId);

  const { data, error } = await supabase.storage
    .from(DRAFT_UPLOADS_BUCKET)
    .list(prefix, { limit: 100, sortBy: { column: "name", order: "asc" } });

  if (error || !data) {
    return [];
  }

  return data
    .filter((entry) => entry.name && !entry.name.endsWith("/"))
    .map((entry) => ({
      path: `${prefix}/${entry.name}`,
      name: entry.name,
      sizeBytes:
        typeof entry.metadata?.size === "number" ? entry.metadata.size : null,
    }));
}
