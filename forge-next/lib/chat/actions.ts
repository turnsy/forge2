"use server";

import { requireRole } from "@/lib/auth/session";
import {
  deleteChatSession,
  initCoachChatSession,
  listRecentChatSessions,
  renameChatSession,
  saveSessionSnapshot as persistSessionSnapshot,
  updateCoachSessionEve,
} from "@/lib/chat/session-storage";
import { generateSessionTitleFromText } from "@/lib/chat/session-title/generate";
import type {
  CoachWorkspaceSnapshot,
  ForgeEvePointer,
} from "@/lib/chat/session-types";

const DEFAULT_SESSION_LIST_LIMIT = 20;

export async function saveSessionSnapshot(
  sessionId: string,
  snapshot: CoachWorkspaceSnapshot,
) {
  const user = await requireRole("coach");
  return persistSessionSnapshot(user.id, sessionId, snapshot);
}

export async function initCoachThread(
  forgeSessionId: string,
  title: string | null,
) {
  const user = await requireRole("coach");
  return initCoachChatSession(user.id, forgeSessionId, title);
}

export async function persistCoachSessionEve(
  forgeSessionId: string,
  eve: ForgeEvePointer,
) {
  const user = await requireRole("coach");
  return updateCoachSessionEve(user.id, forgeSessionId, eve);
}

export async function generateSessionTitleFromPrompt(message: string) {
  await requireRole("coach");
  return generateSessionTitleFromText(message);
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
