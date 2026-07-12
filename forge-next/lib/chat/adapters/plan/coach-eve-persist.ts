import { isCurrentTurnBoundaryEvent } from "eve/client";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import {
  buildCoachWorkspaceSnapshot,
  toForgeEvePointer,
  type CoachTurnMarker,
} from "@/lib/chat/session-types";

const MID_TURN_PERSIST_DEBOUNCE_MS = 2_000;

export type CoachEvePersistSnapshot = {
  forgeSessionId: string;
  title: string | null;
  session: SessionState;
  events: readonly HandleMessageStreamEvent[];
  lastTurn?: CoachTurnMarker | null;
};

export type CoachEvePersister = {
  onStreamEvent: (
    session: SessionState,
    events: readonly HandleMessageStreamEvent[],
    event: HandleMessageStreamEvent,
  ) => Promise<boolean>;
  flush: (
    session: SessionState,
    events: readonly HandleMessageStreamEvent[],
    lastTurn?: CoachTurnMarker | null,
  ) => Promise<boolean>;
  /** Clears write-queue guards so a restarted home workspace can persist again. */
  reset: () => void;
  dispose: () => void;
};

function shouldPersistImmediately(
  events: readonly HandleMessageStreamEvent[],
  event: HandleMessageStreamEvent,
): boolean {
  if (events.length === 1) {
    return true;
  }

  return isCurrentTurnBoundaryEvent(event);
}

export function createCoachEvePersister(options: {
  forgeSessionId: string;
  getTitle: () => string | null;
  saveSnapshot: (snapshot: CoachEvePersistSnapshot) => Promise<boolean>;
}): CoachEvePersister {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingPersist: {
    session: SessionState;
    events: readonly HandleMessageStreamEvent[];
  } | null = null;

  // Saves are async server actions; issued concurrently they can land out of
  // order and let a stale snapshot (fewer events) overwrite a newer one.
  // Serialize all writes and drop any write older than one already issued.
  let writeQueue: Promise<boolean> = Promise.resolve(false);
  let highWaterEventCount = 0;

  const clearDebounce = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const flush = (
    session: SessionState,
    events: readonly HandleMessageStreamEvent[],
    lastTurn: CoachTurnMarker | null = null,
  ): Promise<boolean> => {
    clearDebounce();
    pendingPersist = null;

    const pointer = toForgeEvePointer({
      ...session,
      streamIndex: events.length,
    });

    if (!pointer) {
      return Promise.resolve(false);
    }

    if (events.length < highWaterEventCount) {
      return Promise.resolve(false);
    }

    highWaterEventCount = events.length;

    const result = writeQueue.then(
      () =>
        options.saveSnapshot({
          forgeSessionId: options.forgeSessionId,
          title: options.getTitle(),
          session,
          events,
          lastTurn,
        }),
      () => false,
    );

    writeQueue = result.catch(() => false);
    return result;
  };

  const scheduleDebouncedFlush = (
    session: SessionState,
    events: readonly HandleMessageStreamEvent[],
  ) => {
    pendingPersist = { session, events };

    if (debounceTimer) {
      return;
    }

    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      const pending = pendingPersist;
      pendingPersist = null;

      if (!pending) {
        return;
      }

      void flush(pending.session, pending.events);
    }, MID_TURN_PERSIST_DEBOUNCE_MS);
  };

  const reset = () => {
    clearDebounce();
    pendingPersist = null;
    writeQueue = Promise.resolve(false);
    highWaterEventCount = 0;
  };

  return {
    onStreamEvent(session, events, event) {
      if (shouldPersistImmediately(events, event)) {
        return flush(session, events);
      }

      scheduleDebouncedFlush(session, events);
      return Promise.resolve(false);
    },
    flush,
    reset,
    dispose() {
      const pending = pendingPersist;
      clearDebounce();
      pendingPersist = null;

      if (!pending) {
        return;
      }

      void flush(pending.session, pending.events);
    },
  };
}

export function buildPersistedCoachSnapshot(
  input: CoachEvePersistSnapshot,
): ReturnType<typeof buildCoachWorkspaceSnapshot> {
  const pointer = toForgeEvePointer({
    ...input.session,
    streamIndex: input.events.length,
  });

  if (!pointer) {
    throw new Error("Cannot persist coach session without an Eve session id.");
  }

  return buildCoachWorkspaceSnapshot({
    forgeSessionId: input.forgeSessionId,
    title: input.title,
    eve: pointer,
    eveEvents: input.events,
    lastTurn: input.lastTurn ?? null,
  });
}
