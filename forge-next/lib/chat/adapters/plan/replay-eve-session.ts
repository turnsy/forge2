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

/**
 * How long to wait for the stream to deliver its first event. This covers
 * connection latency and server cold starts. When we already hold events, we
 * request from `known - 1` so a caught-up server still echoes one event back
 * — a positive "you have everything" signal instead of ambiguous silence.
 */
const CONNECT_TIMEOUT_MS = 12_000;

/**
 * Quiet gap after which a replaying stream is considered drained. Buffered
 * server events arrive back-to-back once the stream is open, so this only
 * elapses when the server genuinely has nothing more buffered.
 */
const REPLAY_QUIET_MS = 750;

/**
 * Hard cap on the reconcile window after the first event. A live turn can
 * stream without quiet gaps; reconcile hands anything unfinished to the live
 * tail (which renders events as they arrive) instead of blocking the load.
 */
const REPLAY_WINDOW_MS = 3_000;

/** Max quiet gap between live events before a tail is declared dead. */
export const TAIL_IDLE_TIMEOUT_MS = 30_000;

function toSessionState(
  pointer: ForgeEvePointer,
  streamIndex = 0,
): SessionState {
  return toEveSessionState(pointer, streamIndex);
}

const STREAM_TIMEOUT = Symbol("stream-timeout");

async function nextWithTimeout<T>(
  iterator: AsyncIterator<T>,
  timeoutMs: number,
): Promise<IteratorResult<T> | typeof STREAM_TIMEOUT> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      iterator.next(),
      new Promise<typeof STREAM_TIMEOUT>((resolve) => {
        timer = setTimeout(() => resolve(STREAM_TIMEOUT), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Streams events from `startIndex`, deciding each wait dynamically. Ends when
 * `nextTimeoutMs` returns null or the wait elapses, on stream end, on abort,
 * or when `stopAfter` matches an event.
 */
async function collectStreamEvents(
  pointer: ForgeEvePointer,
  forgeSessionId: string,
  options: {
    startIndex: number;
    signal?: AbortSignal;
    onEvent?: (event: HandleMessageStreamEvent) => void;
    stopAfter?: (event: HandleMessageStreamEvent) => boolean;
    /** Returns the wait budget before the next event, or null to stop. */
    nextTimeoutMs: (received: readonly HandleMessageStreamEvent[]) => number | null;
  },
): Promise<{ events: HandleMessageStreamEvent[]; sawBoundary: boolean }> {
  const client = createForgeEveClient(forgeSessionId);
  const session = client.session(toSessionState(pointer, options.startIndex));

  const controller = new AbortController();
  const onParentAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onParentAbort);

  const events: HandleMessageStreamEvent[] = [];
  let sawBoundary = false;

  try {
    const stream = session.stream({
      startIndex: options.startIndex,
      signal: controller.signal,
    });
    const iterator = stream[Symbol.asyncIterator]();

    while (!options.signal?.aborted) {
      const timeoutMs = options.nextTimeoutMs(events);
      if (timeoutMs === null) {
        break;
      }

      const next = await nextWithTimeout(iterator, timeoutMs);

      if (next === STREAM_TIMEOUT || next.done) {
        break;
      }

      const event = next.value;
      events.push(event);
      options.onEvent?.(event);

      if (isCurrentTurnBoundaryEvent(event)) {
        sawBoundary = true;
      }

      if (options.stopAfter?.(event)) {
        break;
      }
    }
  } catch (error) {
    if (!controller.signal.aborted && !options.signal?.aborted) {
      throw error;
    }
  } finally {
    controller.abort();
    options.signal?.removeEventListener("abort", onParentAbort);
  }

  return { events, sawBoundary };
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
 *
 * Opens one stream from `cached - 1` (or 0 with no cache) so a caught-up
 * server positively confirms by echoing the last known event; only after
 * that echo does a short quiet gap mean "nothing newer exists". This makes
 * the result immune to connection/cold-start latency: slow servers delay the
 * load, they can never silently drop turns. Anything still mid-turn is
 * handed to the live tail; a terminal marker holds only when the server
 * delivered nothing past it.
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
  const echoCount = prefix.length > 0 ? 1 : 0;
  const startIndex = prefix.length > 0 ? prefix.length - 1 : 0;

  let windowDeadline: number | null = null;

  const { events: received } = await collectStreamEvents(
    pointer,
    forgeSessionId,
    {
      startIndex,
      signal: options?.signal,
      nextTimeoutMs: (events) => {
        if (events.length === 0) {
          return CONNECT_TIMEOUT_MS;
        }

        if (windowDeadline === null) {
          windowDeadline = Date.now() + REPLAY_WINDOW_MS;
        }

        const remaining = windowDeadline - Date.now();
        if (remaining <= 0) {
          return null;
        }

        return Math.min(REPLAY_QUIET_MS, remaining);
      },
    },
  );

  const fresh = received.slice(echoCount);
  const events = [...prefix, ...fresh];
  const complete = isTurnComplete(events);
  const markerStillApplies = !complete && fresh.length === 0 && marker !== null;

  return {
    events,
    needsLiveTail: !complete && events.length > 0 && !markerStillApplies,
    markerApplies: markerStillApplies,
  };
}

export type TailEveSessionResult = {
  events: HandleMessageStreamEvent[];
  /** True when the turn reached a boundary event. */
  completed: boolean;
};

/**
 * Tails a possibly-live turn, surfacing events as they arrive. Requests from
 * `startIndex - 1` so the server echoes the last known event, confirming the
 * connection before any silence is interpreted. Ends at a turn boundary, on
 * abort, or when the live stream stays quiet past the idle window — which,
 * post-echo, means no producer is running and the turn is dead.
 */
export async function tailEveSessionEvents(
  pointer: ForgeEvePointer,
  forgeSessionId: string,
  options: {
    startIndex: number;
    signal?: AbortSignal;
    onEvent?: (event: HandleMessageStreamEvent) => void;
    idleTimeoutMs?: number;
  },
): Promise<TailEveSessionResult> {
  const echoCount = options.startIndex > 0 ? 1 : 0;
  const idleTimeoutMs = options.idleTimeoutMs ?? TAIL_IDLE_TIMEOUT_MS;
  const fresh: HandleMessageStreamEvent[] = [];
  let receivedCount = 0;

  await collectStreamEvents(pointer, forgeSessionId, {
    startIndex: options.startIndex - echoCount,
    signal: options.signal,
    onEvent: (event) => {
      receivedCount += 1;

      // The first event is the echo of the last event we already hold; it
      // confirms the connection but is not new data.
      if (receivedCount <= echoCount) {
        return;
      }

      fresh.push(event);
      options.onEvent?.(event);
    },
    stopAfter: (event) =>
      receivedCount > echoCount && isCurrentTurnBoundaryEvent(event),
    nextTimeoutMs: (received) =>
      received.length === 0 ? CONNECT_TIMEOUT_MS : idleTimeoutMs,
  });

  return { events: fresh, completed: isTurnComplete(fresh) };
}

export function isTurnComplete(
  events: readonly HandleMessageStreamEvent[],
): boolean {
  const lastEvent = events[events.length - 1];
  return Boolean(lastEvent && isCurrentTurnBoundaryEvent(lastEvent));
}
