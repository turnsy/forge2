import { createClient } from "@/utils/supabase/server";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";
import {
  SESSION_FALLBACK_TITLE,
  generateSessionTitle,
  shouldGenerateSessionTitle,
} from "@/lib/chat/session-title";

type ChatSessionRow = {
  id: string;
  snapshot: ChatSessionSnapshot;
  created_at: string;
  updated_at: string;
};

export type SaveSessionResult =
  | { status: "saved"; title: string | null }
  | { status: "error"; message: string };

export type LoadSessionResult =
  | {
      status: "found";
      session: {
        id: string;
        snapshot: ChatSessionSnapshot;
        createdAt: string;
        updatedAt: string;
      };
    }
  | { status: "not_found" }
  | { status: "error"; message: string };

export type ListSessionsResult = {
  sessions: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    preview: string;
  }[];
};

const PREVIEW_MAX_LENGTH = 120;

export { buildSnapshotFromState } from "@/lib/chat/session-snapshot";

export function extractSessionPreview(snapshot: ChatSessionSnapshot): string {
  const firstMessage = snapshot.messages[0];
  if (!firstMessage?.content) {
    return "";
  }

  const trimmed = firstMessage.content.trim();
  if (trimmed.length <= PREVIEW_MAX_LENGTH) {
    return trimmed;
  }

  return `${trimmed.slice(0, PREVIEW_MAX_LENGTH)}…`;
}

async function resolveSnapshotTitle(
  snapshot: ChatSessionSnapshot,
  options?: { generateTitle?: boolean },
): Promise<string | null> {
  const clientTitle = snapshot.title?.trim();
  if (clientTitle) {
    return clientTitle;
  }

  if (shouldGenerateSessionTitle(snapshot, options)) {
    return generateSessionTitle(snapshot);
  }

  return null;
}

export async function saveChatSession(
  coachId: string,
  sessionId: string,
  snapshot: ChatSessionSnapshot,
  options?: { generateTitle?: boolean },
): Promise<SaveSessionResult> {
  const supabase = await createClient();
  const title = await resolveSnapshotTitle(snapshot, options);
  const snapshotToSave: ChatSessionSnapshot = { ...snapshot, title };

  const { error } = await supabase.from("chat_sessions").upsert(
    {
      id: sessionId,
      coach_id: coachId,
      snapshot: snapshotToSave,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "saved", title };
}

export async function loadChatSession(
  coachId: string,
  sessionId: string,
): Promise<LoadSessionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, snapshot, created_at, updated_at")
    .eq("id", sessionId)
    .eq("coach_id", coachId)
    .maybeSingle();

  if (error) {
    return { status: "error", message: error.message };
  }

  if (!data) {
    return { status: "not_found" };
  }

  const row = data as ChatSessionRow;

  return {
    status: "found",
    session: {
      id: row.id,
      snapshot: row.snapshot,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  };
}

export async function listRecentChatSessions(
  coachId: string,
  limit = 20,
): Promise<ListSessionsResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, snapshot, created_at, updated_at")
    .eq("coach_id", coachId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ChatSessionRow[];

  return {
    sessions: rows.map((row) => ({
      id: row.id,
      title: row.snapshot.title?.trim() || SESSION_FALLBACK_TITLE,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      preview: extractSessionPreview(row.snapshot),
    })),
  };
}
