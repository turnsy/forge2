import { createClient } from "@/utils/supabase/data-client";
import {
  SESSION_UPLOADS_BUCKET,
  sessionUploadObjectPath,
} from "@/lib/uploads/storage-paths";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ContextFileId = string;

type StorageSupabaseClient = SupabaseClient;

export type SaveUploadContextInput = {
  coachId: string;
  sessionId: string;
  /** Object slug under the session prefix (e.g. `workbook-name__summary`). */
  slug: string;
  normalizedText: string;
};

export type SaveUploadContextResult =
  | { ok: true; contextFileId: ContextFileId }
  | { ok: false; code: "STORAGE_FAILED"; message: string };

function assertCoachOwnsContextPath(
  coachId: string,
  contextFileId: string,
): boolean {
  const prefix = `${coachId}/`;
  return contextFileId.startsWith(prefix) && !contextFileId.includes("..");
}

export async function saveUploadContext(
  input: SaveUploadContextInput,
  client?: StorageSupabaseClient,
): Promise<SaveUploadContextResult> {
  const supabase = client ?? (await createClient());
  const objectPath = sessionUploadObjectPath(
    input.coachId,
    input.sessionId,
    input.slug,
  );

  const body = Buffer.from(input.normalizedText, "utf8");
  const { error } = await supabase.storage
    .from(SESSION_UPLOADS_BUCKET)
    .upload(objectPath, body, {
      contentType: "text/plain; charset=utf-8",
      upsert: true,
    });

  if (error) {
    return {
      ok: false,
      code: "STORAGE_FAILED",
      message: error.message,
    };
  }

  return { ok: true, contextFileId: objectPath };
}

export async function loadUploadContextById(
  contextFileId: ContextFileId,
  coachId: string,
  client?: StorageSupabaseClient,
): Promise<string | null> {
  if (!assertCoachOwnsContextPath(coachId, contextFileId)) {
    return null;
  }

  const supabase = client ?? (await createClient());
  const { data, error } = await supabase.storage
    .from(SESSION_UPLOADS_BUCKET)
    .download(contextFileId);

  if (error || !data) {
    return null;
  }

  return data.text();
}

export async function deleteUploadContext(
  contextFileIds: ContextFileId[],
  coachId: string,
  client?: StorageSupabaseClient,
): Promise<void> {
  const paths = contextFileIds.filter((id) =>
    assertCoachOwnsContextPath(coachId, id),
  );
  if (paths.length === 0) {
    return;
  }

  const supabase = client ?? (await createClient());
  await supabase.storage.from(SESSION_UPLOADS_BUCKET).remove(paths);
}
