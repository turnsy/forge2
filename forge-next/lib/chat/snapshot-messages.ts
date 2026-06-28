import type { ChatMessage } from "@/lib/chat/types";
import type { CoachWorkspaceSnapshot } from "@/lib/chat/session-types";

export function getSnapshotMessages(
  snapshot: CoachWorkspaceSnapshot,
): ChatMessage[] {
  return snapshot.messages ?? [];
}

export function snapshotHasConversation(
  snapshot: CoachWorkspaceSnapshot,
): boolean {
  return (
    Boolean(snapshot.eve?.sessionId) ||
    getSnapshotMessages(snapshot).length > 0 ||
    Boolean(snapshot.title?.trim())
  );
}
