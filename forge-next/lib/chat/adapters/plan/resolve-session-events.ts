import type { HandleMessageStreamEvent } from "eve/client";
import {
  isTurnComplete,
  restoreEveSessionEvents,
  tailEveSessionEvents,
} from "@/lib/chat/adapters/plan/replay-eve-session";
import {
  getPersistedEveEvents,
  type CoachWorkspaceSnapshot,
} from "@/lib/chat/session-types";

export async function resolveCoachSessionEvents(
  snapshot: CoachWorkspaceSnapshot,
  forgeSessionId: string,
  options?: { signal?: AbortSignal },
): Promise<HandleMessageStreamEvent[]> {
  const persisted = [...getPersistedEveEvents(snapshot)];
  const eve = snapshot.eve;

  if (!eve?.sessionId) {
    return persisted;
  }

  try {
    if (persisted.length > 0) {
      const tail = await tailEveSessionEvents(
        eve,
        forgeSessionId,
        persisted.length,
        options,
      );

      if (tail.length > 0) {
        return [...persisted, ...tail];
      }

      if (isTurnComplete(persisted)) {
        return persisted;
      }
    }

    const restored = await restoreEveSessionEvents(
      eve,
      forgeSessionId,
      options,
    );

    if (restored.length > 0) {
      return restored.length >= persisted.length ? restored : persisted;
    }

    return persisted;
  } catch (error) {
    if (persisted.length > 0) {
      return persisted;
    }

    throw error;
  }
}
