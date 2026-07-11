"use server";

import { requireRole } from "@/lib/auth/session";
import {
  deleteChatSession,
  listRecentChatSessions,
  renameChatSession,
  saveSessionSnapshot as persistSessionSnapshot,
} from "@/lib/chat/session-storage";
import { generateSessionTitleFromText } from "@/lib/chat/session-title/generate";
import type { CoachWorkspaceSnapshot } from "@/lib/chat/session-types";
import { listSessionUploads } from "@/lib/uploads/list-session-uploads";
import { deleteUploadContext } from "@/lib/uploads/context-storage";
import { groupSessionUploadsIntoAttachments } from "@/lib/uploads/session-upload-attachments";

const DEFAULT_SESSION_LIST_LIMIT = 20;

export async function saveSessionSnapshot(
  sessionId: string,
  snapshot: CoachWorkspaceSnapshot,
) {
  const user = await requireRole("coach");
  return persistSessionSnapshot(user.id, sessionId, snapshot);
}

export async function listSessionAttachments(sessionId: string) {
  const user = await requireRole("coach");

  try {
    const items = await listSessionUploads(user.id, sessionId);
    return {
      ok: true as const,
      attachments: groupSessionUploadsIntoAttachments(items),
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Could not load session attachments.",
    };
  }
}

export async function removeSessionAttachments(
  sessionId: string,
  contextFileIds: string[],
) {
  const user = await requireRole("coach");

  if (contextFileIds.length === 0) {
    return { ok: true as const, attachments: [] };
  }

  const result = await deleteUploadContext(contextFileIds, user.id);
  if (!result.ok) {
    return result;
  }

  // Re-list so callers can reconcile UI against storage if needed.
  const items = await listSessionUploads(user.id, sessionId);
  return {
    ok: true as const,
    attachments: groupSessionUploadsIntoAttachments(items),
  };
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
