import type { CoachWorkspaceSnapshot } from "@/lib/chat/session-types";

export function snapshotHasConversation(
  snapshot: CoachWorkspaceSnapshot,
): boolean {
  return (
    Boolean(snapshot.eve?.sessionId) || Boolean(snapshot.title?.trim())
  );
}
