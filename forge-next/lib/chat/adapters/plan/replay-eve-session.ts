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

function resolveProbeTimeoutMs(
  startIndex: number,
  events: readonly HandleMessageStreamEvent[],
): number | undefined {
  if (startIndex > 0 && isTurnComplete(events)) {
    return NEXT_TURN_PROBE_TIMEOUT_MS;
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
    if (timeout?.signal.aborted && !options.signal?.aborted) {
      return events;
    }

    throw error;
  } finally {
    timeout?.dispose();
  }

  return events;
}

/**
 * Hydrates saved Eve events up to the latest checkpoint. Replays completed turns
 * and probes briefly for another finished turn, but does not block on in-flight
 * generation — the workspace resumes the live stream in `waiting` phase.
 */
export async function restoreEveSessionEvents(
  pointer: ForgeEvePointer,
  forgeSessionId: string,
  options?: ReplayEveSessionOptions,
): Promise<HandleMessageStreamEvent[]> {
  if (!pointer.sessionId) {
    return [...(options?.fromEvents ?? [])];
  }

  const prefix = options?.fromEvents ? [...options.fromEvents] : [];

  if (prefix.length > 0 && !isTurnComplete(prefix)) {
    return prefix;
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
        firstEventTimeoutMs: inFlight
          ? NEXT_TURN_PROBE_TIMEOUT_MS
          : resolveProbeTimeoutMs(startIndex, allEvents),
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

  return allEvents;
}

export function isTurnComplete(
  events: readonly HandleMessageStreamEvent[],
): boolean {
  const lastEvent = events[events.length - 1];
  return Boolean(lastEvent && isCurrentTurnBoundaryEvent(lastEvent));
}
