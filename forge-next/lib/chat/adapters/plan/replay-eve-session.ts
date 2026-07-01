import { Client, isCurrentTurnBoundaryEvent } from "eve/client";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";
import type { ForgeEvePointer } from "@/lib/chat/session-types";
import { toEveSessionState } from "@/lib/chat/session-types";

export type ReplayEveSessionOptions = {
  signal?: AbortSignal;
};

/** How long to wait for the first event when probing for another turn. */
const NEXT_TURN_PROBE_TIMEOUT_MS = 2_000;

/** How long to wait for the first event on an initial replay batch. */
const FIRST_BATCH_TIMEOUT_MS = 30_000;

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

function createLinkedAbortSignal(
  parent: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; dispose: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const onParentAbort = () => controller.abort();
  parent?.addEventListener("abort", onParentAbort);

  return {
    signal: parent
      ? AbortSignal.any([parent, controller.signal])
      : controller.signal,
    dispose: () => {
      clearTimeout(timeout);
      parent?.removeEventListener("abort", onParentAbort);
    },
  };
}

async function collectStreamEvents(
  session: SessionState,
  forgeSessionId: string,
  options: {
    startIndex?: number;
    untilTurnBoundary?: boolean;
    signal?: AbortSignal;
    firstEventTimeoutMs?: number;
  },
): Promise<HandleMessageStreamEvent[]> {
  const client = createReplayClient(forgeSessionId);
  const eveSession = client.session(session);
  const events: HandleMessageStreamEvent[] = [];

  const timeout =
    options.firstEventTimeoutMs !== undefined
      ? createLinkedAbortSignal(options.signal, options.firstEventTimeoutMs)
      : null;

  try {
    for await (const event of eveSession.stream({
      startIndex: options.startIndex ?? 0,
      signal: timeout?.signal ?? options.signal,
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
  } catch (error) {
    if (
      events.length === 0 &&
      timeout?.signal.aborted &&
      !options.signal?.aborted
    ) {
      return [];
    }

    throw error;
  } finally {
    timeout?.dispose();
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
    firstEventTimeoutMs: FIRST_BATCH_TIMEOUT_MS,
  });
}

export async function tailEveSessionEvents(
  pointer: ForgeEvePointer,
  forgeSessionId: string,
  startIndex: number,
  options?: ReplayEveSessionOptions,
): Promise<HandleMessageStreamEvent[]> {
  if (!pointer.sessionId || startIndex < 0) {
    return [];
  }

  const allEvents: HandleMessageStreamEvent[] = [];
  let index = startIndex;

  while (!options?.signal?.aborted) {
    const batch = await collectStreamEvents(
      toSessionState(pointer, index),
      forgeSessionId,
      {
        startIndex: index,
        untilTurnBoundary: true,
        signal: options?.signal,
        firstEventTimeoutMs:
          index === startIndex ? NEXT_TURN_PROBE_TIMEOUT_MS : undefined,
      },
    );

    if (batch.length === 0) {
      break;
    }

    allEvents.push(...batch);
    index += batch.length;

    const lastEvent = batch[batch.length - 1];
    if (!lastEvent || !isCurrentTurnBoundaryEvent(lastEvent)) {
      const tailed = await collectStreamEvents(
        toSessionState(pointer, index),
        forgeSessionId,
        {
          startIndex: index,
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
        firstEventTimeoutMs:
          startIndex > 0 ? NEXT_TURN_PROBE_TIMEOUT_MS : undefined,
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

export function isTurnBoundaryEvent(
  event: HandleMessageStreamEvent,
): boolean {
  return isCurrentTurnBoundaryEvent(event);
}

export function isTurnComplete(
  events: readonly HandleMessageStreamEvent[],
): boolean {
  const lastEvent = events[events.length - 1];
  return Boolean(lastEvent && isCurrentTurnBoundaryEvent(lastEvent));
}
