import { createClient } from "@/utils/supabase/server";
import {
  DRAFT_UPLOADS_BUCKET,
  sessionUploadPrefix,
} from "@/lib/uploads/storage-paths";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SessionUploadListItem = {
  /** Storage object path (same as contextFileId). */
  path: string;
  name: string;
  sizeBytes: number | null;
};

type StorageSupabaseClient = SupabaseClient;

/**
 * List normalized upload objects for a coach workspace session.
 * Used by plan-chat tools; not exposed to the browser directly.
 */
export async function listSessionUploads(
  coachId: string,
  sessionId: string,
  client?: StorageSupabaseClient,
): Promise<SessionUploadListItem[]> {
  const supabase = client ?? (await createClient());
  const prefix = sessionUploadPrefix(coachId, sessionId);

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
