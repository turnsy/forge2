import type { HandleMessageStreamEvent } from "eve/client";
import type { ChatMessage } from "@/lib/chat/types";
import type { CoachWorkspaceSnapshot } from "@/lib/chat/session-types";

export function getSnapshotMessages(
  snapshot: CoachWorkspaceSnapshot,
): ChatMessage[] {
  if (snapshot.messages && snapshot.messages.length > 0) {
    return snapshot.messages;
  }

  const events = snapshot.eve?.events ?? [];
  const messages: ChatMessage[] = [];

  for (const event of events) {
    if (event.type !== "message.received") {
      continue;
    }

    const text =
      "message" in event.data && typeof event.data.message === "string"
        ? event.data.message.trim()
        : "";

    if (text.length > 0) {
      messages.push({ role: "user", content: text });
    }
  }

  for (const event of events) {
    if (event.type !== "message.completed") {
      continue;
    }

    const text =
      "message" in event.data && typeof event.data.message === "string"
        ? event.data.message.trim()
        : "";

    if (text.length > 0) {
      messages.push({ role: "assistant", content: text });
    }
  }

  return messages;
}

export function snapshotHasConversation(snapshot: CoachWorkspaceSnapshot): boolean {
  return getSnapshotMessages(snapshot).length > 0 || (snapshot.eve?.events?.length ?? 0) > 0;
}

export function firstUserMessageFromEvents(
  events: readonly HandleMessageStreamEvent[],
): string {
  for (const event of events) {
    if (event.type !== "message.received") {
      continue;
    }

    const text =
      "message" in event.data && typeof event.data.message === "string"
        ? event.data.message.trim()
        : "";

    if (text.length > 0) {
      return text;
    }
  }

  return "";
}
