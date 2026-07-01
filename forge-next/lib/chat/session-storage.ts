import { createClient } from "@/utils/supabase/server";
import type {
  CoachWorkspaceSnapshot,
  ForgeEvePointer,
} from "@/lib/chat/session-types";
import { SESSION_FALLBACK_TITLE } from "@/lib/chat/session-title/generate";

type ChatSessionRow = {
  id: string;
  snapshot: CoachWorkspaceSnapshot;
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
        snapshot: CoachWorkspaceSnapshot;
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
  }[];
};

export type SaveSessionSnapshotResult =
  | { ok: true; title: string | null }
  | { ok: false; message: string };

export type InitCoachSessionResult =
  | { ok: true }
  | { ok: false; message: string };

export type UpdateCoachSessionEveResult =
  | { ok: true }
  | { ok: false; message: string };

export async function saveChatSession(
  coachId: string,
  sessionId: string,
  snapshot: CoachWorkspaceSnapshot,
): Promise<SaveSessionResult> {
  const supabase = await createClient();
  const title = snapshot.title?.trim() || null;
  const snapshotToSave: CoachWorkspaceSnapshot = { ...snapshot, title };

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

export async function saveSessionSnapshot(
  coachId: string,
  sessionId: string,
  snapshot: CoachWorkspaceSnapshot,
): Promise<SaveSessionSnapshotResult> {
  const result = await saveChatSession(coachId, sessionId, snapshot);

  if (result.status === "error") {
    return { ok: false, message: result.message };
  }

  return { ok: true, title: result.title };
}

export async function initCoachChatSession(
  coachId: string,
  forgeSessionId: string,
  title: string | null,
): Promise<InitCoachSessionResult> {
  const result = await saveChatSession(coachId, forgeSessionId, {
    forgeSessionId,
    title,
    eve: null,
  });

  if (result.status === "error") {
    return { ok: false, message: result.message };
  }

  return { ok: true };
}

export async function updateCoachSessionEve(
  coachId: string,
  forgeSessionId: string,
  eve: ForgeEvePointer,
): Promise<UpdateCoachSessionEveResult> {
  const loadResult = await loadChatSession(coachId, forgeSessionId);

  if (loadResult.status === "not_found") {
    return { ok: false, message: "Session not found." };
  }

  if (loadResult.status === "error") {
    return { ok: false, message: loadResult.message };
  }

  const saveResult = await saveChatSession(coachId, forgeSessionId, {
    ...loadResult.session.snapshot,
    eve,
  });

  if (saveResult.status === "error") {
    return { ok: false, message: saveResult.message };
  }

  return { ok: true };
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

export type RenameSessionResult =
  | { ok: true }
  | { ok: false; message: string };

export type DeleteSessionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function renameChatSession(
  coachId: string,
  sessionId: string,
  title: string,
): Promise<RenameSessionResult> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return { ok: false, message: "Title cannot be empty." };
  }

  const loadResult = await loadChatSession(coachId, sessionId);
  if (loadResult.status === "not_found") {
    return { ok: false, message: "Session not found." };
  }
  if (loadResult.status === "error") {
    return { ok: false, message: loadResult.message };
  }

  const saveResult = await saveChatSession(coachId, sessionId, {
    ...loadResult.session.snapshot,
    title: trimmedTitle,
  });

  if (saveResult.status === "error") {
    return { ok: false, message: saveResult.message };
  }

  return { ok: true };
}

export async function deleteChatSession(
  coachId: string,
  sessionId: string,
): Promise<DeleteSessionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId)
    .eq("coach_id", coachId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
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
    })),
  };
}
