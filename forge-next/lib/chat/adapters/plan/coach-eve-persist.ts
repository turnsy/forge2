import { isCurrentTurnBoundaryEvent } from "eve/client";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import {
  buildCoachWorkspaceSnapshot,
  toForgeEvePointer,
} from "@/lib/chat/session-types";

const MID_TURN_PERSIST_DEBOUNCE_MS = 2_000;

export type CoachEvePersistSnapshot = {
  forgeSessionId: string;
  title: string | null;
  session: SessionState;
  events: readonly HandleMessageStreamEvent[];
};

export type CoachEvePersister = {
  onStreamEvent: (
    session: SessionState,
    events: readonly HandleMessageStreamEvent[],
    event: HandleMessageStreamEvent,
  ) => Promise<boolean>;
  onFinish: (
    session: SessionState,
    events: readonly HandleMessageStreamEvent[],
  ) => void;
  flush: (
    session: SessionState,
    events: readonly HandleMessageStreamEvent[],
  ) => Promise<boolean>;
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

  const clearDebounce = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const flush = async (
    session: SessionState,
    events: readonly HandleMessageStreamEvent[],
  ) => {
    clearDebounce();
    pendingPersist = null;

    const pointer = toForgeEvePointer({
      ...session,
      streamIndex: events.length,
    });

    if (!pointer) {
      return false;
    }

    return options.saveSnapshot({
      forgeSessionId: options.forgeSessionId,
      title: options.getTitle(),
      session,
      events,
    });
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

  return {
    onStreamEvent(session, events, event) {
      if (shouldPersistImmediately(events, event)) {
        return flush(session, events);
      }

      scheduleDebouncedFlush(session, events);
      return Promise.resolve(false);
    },
    onFinish(session, events) {
      return flush(session, events);
    },
    flush,
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
  });
}
