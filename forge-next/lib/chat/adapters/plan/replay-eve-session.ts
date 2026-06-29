import { Client, isCurrentTurnBoundaryEvent } from "eve/client";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";
import type { ForgeEvePointer } from "@/lib/chat/session-types";
import { toEveSessionState } from "@/lib/chat/session-types";

export type ReplayEveSessionOptions = {
  signal?: AbortSignal;
};

function createReplayClient(forgeSessionId: string): Client {
  return new Client({
    host: "",
    headers: {
      [FORGE_SESSION_HEADER]: forgeSessionId,
    },
    preserveCompletedSessions: true,
  });
}

function toSessionState(
  pointer: ForgeEvePointer,
  streamIndex = 0,
): SessionState {
  return toEveSessionState(pointer, streamIndex);
}

async function collectStreamEvents(
  session: SessionState,
  forgeSessionId: string,
  options: {
    startIndex?: number;
    untilTurnBoundary?: boolean;
    signal?: AbortSignal;
  },
): Promise<HandleMessageStreamEvent[]> {
  const client = createReplayClient(forgeSessionId);
  const eveSession = client.session(session);
  const events: HandleMessageStreamEvent[] = [];

  for await (const event of eveSession.stream({
    startIndex: options.startIndex ?? 0,
    signal: options.signal,
  })) {
    if (options.signal?.aborted) {
      break;
    }

    events.push(event);

    if (
      options.untilTurnBoundary &&
      isCurrentTurnBoundaryEvent(event)
    ) {
      break;
    }
  }

  return events;
}

export async function replayEveSessionEvents(
  pointer: ForgeEvePointer,
  forgeSessionId: string,
  options?: ReplayEveSessionOptions,
): Promise<HandleMessageStreamEvent[]> {
  if (!pointer.sessionId) {
    return [];
  }

  return collectStreamEvents(toSessionState(pointer), forgeSessionId, {
    startIndex: 0,
    untilTurnBoundary: true,
    signal: options?.signal,
  });
}

export async function restoreEveSessionEvents(
  pointer: ForgeEvePointer,
  forgeSessionId: string,
  options?: ReplayEveSessionOptions,
): Promise<HandleMessageStreamEvent[]> {
  if (!pointer.sessionId) {
    return [];
  }

  const allEvents: HandleMessageStreamEvent[] = [];
  let startIndex = 0;

  while (!options?.signal?.aborted) {
    const batch = await collectStreamEvents(
      toSessionState(pointer, startIndex),
      forgeSessionId,
      {
        startIndex,
        untilTurnBoundary: true,
        signal: options?.signal,
      },
    );

    if (batch.length === 0) {
      break;
    }

    allEvents.push(...batch);
    startIndex += batch.length;

    const lastEvent = batch[batch.length - 1];
    if (!lastEvent || !isCurrentTurnBoundaryEvent(lastEvent)) {
      const tailed = await collectStreamEvents(
        toSessionState(pointer, startIndex),
        forgeSessionId,
        {
          startIndex,
          untilTurnBoundary: true,
          signal: options?.signal,
        },
      );

      if (tailed.length > 0) {
        allEvents.push(...tailed);
      }

      break;
    }
  }

  return allEvents;
}

export function isTurnComplete(
  events: readonly HandleMessageStreamEvent[],
): boolean {
  const lastEvent = events[events.length - 1];
  return Boolean(lastEvent && isCurrentTurnBoundaryEvent(lastEvent));
}
