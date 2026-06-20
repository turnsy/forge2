"use server";

import { requireRole } from "@/lib/auth/session";
import { saveChatSession } from "@/lib/chat/session-storage";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";

export async function saveSessionSnapshot(
  sessionId: string,
  snapshot: ChatSessionSnapshot,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const user = await requireRole("coach");
  const result = await saveChatSession(user.id, sessionId, snapshot);

  if (result.status === "error") {
    return { ok: false, message: result.message };
  }

  return { ok: true };
}
