"use server";

import { requireRole } from "@/lib/auth/session";
import {
  deleteChatSession,
  listRecentChatSessions,
  renameChatSession,
  saveSessionSnapshot as persistSessionSnapshot,
} from "@/lib/chat/session-storage";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";

const DEFAULT_SESSION_LIST_LIMIT = 20;

export async function saveSessionSnapshot(
  sessionId: string,
  snapshot: ChatSessionSnapshot,
) {
  const user = await requireRole("coach");
  return persistSessionSnapshot(user.id, sessionId, snapshot);
}

export async function listTaskSessions(limit = DEFAULT_SESSION_LIST_LIMIT) {
  const user = await requireRole("coach");

  try {
    const { sessions } = await listRecentChatSessions(user.id, limit);
    return {
      ok: true as const,
      sessions: sessions.map((session) => ({
        id: session.id,
        title: session.title,
        updatedAt: session.updatedAt,
      })),
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error ? error.message : "Could not load conversations.",
    };
  }
}

export async function renameTaskSession(sessionId: string, title: string) {
  const user = await requireRole("coach");
  return renameChatSession(user.id, sessionId, title);
}

export async function deleteTaskSession(sessionId: string) {
  const user = await requireRole("coach");
  return deleteChatSession(user.id, sessionId);
}
