import { isCurrentTurnBoundaryEvent } from "eve/client";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { createForgeEveClient } from "@/lib/chat/adapters/plan/forge-eve-client";
import type { ForgeEvePointer } from "@/lib/chat/session-types";
import { toEveSessionState } from "@/lib/chat/session-types";

export type ReplayEveSessionOptions = {
  signal?: AbortSignal;
  /** Persisted prefix to hydrate instantly and tail from `fromEvents.length`. */
  fromEvents?: readonly HandleMessageStreamEvent[];
};

/** How long to wait for the first event when probing for another turn. */
const NEXT_TURN_PROBE_TIMEOUT_MS = 2_000;

/** How long to wait for live events when tailing an in-flight turn on reload. */
export const IN_FLIGHT_TAIL_TIMEOUT_MS = 30_000;

function resolveFirstEventTimeoutMs(
  startIndex: number,
  events: readonly HandleMessageStreamEvent[],
): number | undefined {
  if (startIndex > 0 && isTurnComplete(events)) {
    return NEXT_TURN_PROBE_TIMEOUT_MS;
  }

  if (startIndex > 0 && !isTurnComplete(events)) {
    return IN_FLIGHT_TAIL_TIMEOUT_MS;
  }

  return undefined;
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
  const client = createForgeEveClient(forgeSessionId);
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
  });
}

export async function restoreEveSessionEvents(
  pointer: ForgeEvePointer,
  forgeSessionId: string,
  options?: ReplayEveSessionOptions,
): Promise<HandleMessageStreamEvent[]> {
  if (!pointer.sessionId) {
    return [...(options?.fromEvents ?? [])];
  }

  const prefix = options?.fromEvents ? [...options.fromEvents] : [];
  const allEvents: HandleMessageStreamEvent[] = [...prefix];
  let startIndex = prefix.length;

  while (!options?.signal?.aborted) {
    const batch = await collectStreamEvents(
      toSessionState(pointer, startIndex),
      forgeSessionId,
      {
        startIndex,
        untilTurnBoundary: true,
        signal: options?.signal,
        firstEventTimeoutMs: resolveFirstEventTimeoutMs(startIndex, allEvents),
      },
    );

    if (batch.length === 0) {
      break;
    }

    allEvents.push(...batch);
    startIndex += batch.length;

    if (isTurnComplete(allEvents)) {
      continue;
    }

    const tailed = await collectStreamEvents(
      toSessionState(pointer, startIndex),
      forgeSessionId,
      {
        startIndex,
        untilTurnBoundary: true,
        signal: options?.signal,
        firstEventTimeoutMs: IN_FLIGHT_TAIL_TIMEOUT_MS,
      },
    );

    if (tailed.length > 0) {
      allEvents.push(...tailed);
      startIndex += tailed.length;
    }

    break;
  }

  return allEvents;
}

export function isTurnComplete(
  events: readonly HandleMessageStreamEvent[],
): boolean {
  const lastEvent = events[events.length - 1];
  return Boolean(lastEvent && isCurrentTurnBoundaryEvent(lastEvent));
}
