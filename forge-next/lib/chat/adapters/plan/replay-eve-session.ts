import { isCurrentTurnBoundaryEvent } from "eve/client";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { createForgeEveClient } from "@/lib/chat/adapters/plan/forge-eve-client";
import type { CoachTurnMarker, ForgeEvePointer } from "@/lib/chat/session-types";
import { resolveActiveTurnMarker, toEveSessionState } from "@/lib/chat/session-types";

export type ReplayEveSessionOptions = {
  signal?: AbortSignal;
  /** Persisted prefix to hydrate instantly and reconcile from `fromEvents.length`. */
  fromEvents?: readonly HandleMessageStreamEvent[];
  /** Persisted terminal-turn annotation; superseded if the server has more events. */
  lastTurn?: CoachTurnMarker | null;
};

/** How long to wait for the first event when probing for more server events. */
const NEXT_TURN_PROBE_TIMEOUT_MS = 2_000;

/** Overall cap on the initial no-cache replay batch so dead sessions cannot hang the load. */
const INITIAL_FETCH_TIMEOUT_MS = 15_000;

/** How long to wait for the first live event when tailing an in-flight turn. */
export const TAIL_FIRST_EVENT_TIMEOUT_MS = 4_000;

/** Max quiet gap between live events before a tail is declared dead. */
export const TAIL_IDLE_TIMEOUT_MS = 30_000;

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
    if (timeout?.signal.aborted && !options.signal?.aborted) {
      return events;
    }

    throw error;
  } finally {
    timeout?.dispose();
  }

  return events;
}

export type RestoredEveSession = {
  events: HandleMessageStreamEvent[];
  /**
   * True when the log ends mid-turn with no terminal marker — a turn may
   * still be running server-side and the caller should tail it live.
   */
  needsLiveTail: boolean;
  /** True when a persisted marker still annotates the end of the log. */
  markerApplies: boolean;
};

/**
 * Reconciles the persisted event cache against Eve, the source of truth.
 * Replays completed turns and probes briefly for newer server events. A
 * terminal marker only holds if the server has nothing past it; a mid-turn
 * log without a marker is handed back for live tailing.
 */
export async function restoreEveSessionEvents(
  pointer: ForgeEvePointer,
  forgeSessionId: string,
  options?: ReplayEveSessionOptions,
): Promise<RestoredEveSession> {
  const prefix = options?.fromEvents ? [...options.fromEvents] : [];

  if (!pointer.sessionId) {
    return { events: prefix, needsLiveTail: false, markerApplies: false };
  }

  const marker = resolveActiveTurnMarker(options?.lastTurn, prefix.length);

  if (prefix.length > 0 && !isTurnComplete(prefix) && !marker) {
    // Possibly a live turn; hydrate instantly and let the caller tail it.
    return { events: prefix, needsLiveTail: true, markerApplies: false };
  }

  const allEvents: HandleMessageStreamEvent[] = [...prefix];
  let startIndex = prefix.length;

  while (!options?.signal?.aborted) {
    const inFlight = allEvents.length > 0 && !isTurnComplete(allEvents);

    const batch = await collectStreamEvents(
      toSessionState(pointer, startIndex),
      forgeSessionId,
      {
        startIndex,
        untilTurnBoundary: !inFlight,
        signal: options?.signal,
        firstEventTimeoutMs:
          startIndex > 0 ? NEXT_TURN_PROBE_TIMEOUT_MS : INITIAL_FETCH_TIMEOUT_MS,
      },
    );

    if (batch.length === 0) {
      break;
    }

    allEvents.push(...batch);
    startIndex += batch.length;

    if (!isTurnComplete(allEvents)) {
      break;
    }
  }

  const complete = isTurnComplete(allEvents);
  const markerStillApplies =
    !complete &&
    resolveActiveTurnMarker(options?.lastTurn, allEvents.length) !== null;

  return {
    events: allEvents,
    // A marker-annotated log that gained no new events stays settled. If the
    // server delivered events past the marker but the turn is still open,
    // hand it to the live tail.
    needsLiveTail: !complete && allEvents.length > 0 && !markerStillApplies,
    markerApplies: markerStillApplies,
  };
}

const TAIL_TIMEOUT = Symbol("tail-timeout");

async function nextWithTimeout<T>(
  iterator: AsyncIterator<T>,
  timeoutMs: number,
): Promise<IteratorResult<T> | typeof TAIL_TIMEOUT> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      iterator.next(),
      new Promise<typeof TAIL_TIMEOUT>((resolve) => {
        timer = setTimeout(() => resolve(TAIL_TIMEOUT), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

export type TailEveSessionResult = {
  events: HandleMessageStreamEvent[];
  /** True when the turn reached a boundary event. */
  completed: boolean;
};

/**
 * Tails a possibly-live turn from `startIndex`, surfacing events as they
 * arrive. Ends at a turn boundary, on abort, or when the stream goes quiet
 * (short window for the first event, a longer idle gap after that) — a quiet
 * stream means no producer is running and the turn is dead.
 */
export async function tailEveSessionEvents(
  pointer: ForgeEvePointer,
  forgeSessionId: string,
  options: {
    startIndex: number;
    signal?: AbortSignal;
    onEvent?: (event: HandleMessageStreamEvent) => void;
    firstEventTimeoutMs?: number;
    idleTimeoutMs?: number;
  },
): Promise<TailEveSessionResult> {
  const client = createForgeEveClient(forgeSessionId);
  const session = client.session(toSessionState(pointer, options.startIndex));

  const controller = new AbortController();
  const onParentAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onParentAbort);

  const events: HandleMessageStreamEvent[] = [];
  let completed = false;

  try {
    const stream = session.stream({
      startIndex: options.startIndex,
      signal: controller.signal,
    });
    const iterator = stream[Symbol.asyncIterator]();

    let timeoutMs = options.firstEventTimeoutMs ?? TAIL_FIRST_EVENT_TIMEOUT_MS;

    while (!options.signal?.aborted) {
      const next = await nextWithTimeout(iterator, timeoutMs);

      if (next === TAIL_TIMEOUT || next.done) {
        break;
      }

      const event = next.value;
      events.push(event);
      options.onEvent?.(event);

      if (isCurrentTurnBoundaryEvent(event)) {
        completed = true;
        break;
      }

      timeoutMs = options.idleTimeoutMs ?? TAIL_IDLE_TIMEOUT_MS;
    }
  } catch (error) {
    if (!controller.signal.aborted && !options.signal?.aborted) {
      throw error;
    }
  } finally {
    controller.abort();
    options.signal?.removeEventListener("abort", onParentAbort);
  }

  return { events, completed };
}

export function isTurnComplete(
  events: readonly HandleMessageStreamEvent[],
): boolean {
  const lastEvent = events[events.length - 1];
  return Boolean(lastEvent && isCurrentTurnBoundaryEvent(lastEvent));
}
