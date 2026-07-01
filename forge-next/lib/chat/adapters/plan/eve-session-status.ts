import { isTurnComplete } from "@/lib/chat/adapters/plan/replay-eve-session";
import {
  getPersistedEveEvents,
  type CoachWorkspaceSnapshot,
  type ForgeEvePointer,
} from "@/lib/chat/session-types";
import type { HandleMessageStreamEvent } from "eve/client";

export function getEveStreamTailStartIndex(
  _eve: ForgeEvePointer | null | undefined,
  events: readonly HandleMessageStreamEvent[],
): number {
  return events.length;
}

export function mayHaveInFlightEveTurn(
  snapshot: CoachWorkspaceSnapshot,
  events: readonly HandleMessageStreamEvent[] = getPersistedEveEvents(
    snapshot,
  ),
): boolean {
  const eve = snapshot.eve;
  if (!eve?.sessionId) {
    return false;
  }

  if (!isTurnComplete(events)) {
    return true;
  }

  const streamIndex = eve.streamIndex ?? events.length;
  return streamIndex > events.length;
}
