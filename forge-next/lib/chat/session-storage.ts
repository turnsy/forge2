import { createClient } from "@/utils/supabase/server";
import type { ChatWorkspaceState } from "@/lib/chat/types";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const PREVIEW_MAX_LENGTH = 120;

type ChatSessionRow = {
  id: string;
  snapshot: ChatSessionSnapshot;
  created_at: string;
  updated_at: string;
};

type ChatSessionListRow = {
  id: string;
  snapshot: ChatSessionSnapshot;
  created_at: string;
  updated_at: string;
};

export type SaveSessionResult =
  | { status: "saved" }
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
  sessions: { id: string; createdAt: string; updatedAt: string; preview: string }[];
};

export function buildSnapshotFromState(
  state: ChatWorkspaceState<WorkoutPlan>,
): ChatSessionSnapshot {
  return {
    messages: state.messages,
    currentArtifact: state.currentArtifact,
    planId: state.planId,
    artifactTitle: state.artifactTitle,
    contextFileIds: state.contextFileIds,
  };
}

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

export async function saveChatSession(
  coachId: string,
  sessionId: string,
  snapshot: ChatSessionSnapshot,
): Promise<SaveSessionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("chat_sessions").upsert(
    {
      id: sessionId,
      coach_id: coachId,
      snapshot,
    },
    { onConflict: "id" },
  );

  if (error) {
    return { status: "error", message: error.message };
  }

  return { status: "saved" };
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

  const rows = (data ?? []) as ChatSessionListRow[];

  return {
    sessions: rows.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      preview: extractSessionPreview(row.snapshot),
    })),
  };
}
