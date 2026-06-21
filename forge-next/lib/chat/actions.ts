"use server";

import { requireRole } from "@/lib/auth/session";
import { saveSessionSnapshot as persistSessionSnapshot } from "@/lib/chat/session-storage";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";

export async function saveSessionSnapshot(
  sessionId: string,
  snapshot: ChatSessionSnapshot,
) {
  const user = await requireRole("coach");
  return persistSessionSnapshot(user.id, sessionId, snapshot);
}
