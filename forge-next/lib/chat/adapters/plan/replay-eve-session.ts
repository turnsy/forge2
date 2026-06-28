import { Client, isCurrentTurnBoundaryEvent } from "eve/client";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";

export type ReplayEveSessionOptions = {
  signal?: AbortSignal;
};

export async function replayEveSessionEvents(
  session: SessionState,
  forgeSessionId: string,
  options?: ReplayEveSessionOptions,
): Promise<HandleMessageStreamEvent[]> {
  if (!session.sessionId || session.streamIndex === 0) {
    return [];
  }

  const client = new Client({
    host: "",
    headers: {
      [FORGE_SESSION_HEADER]: forgeSessionId,
    },
  });
  const eveSession = client.session(session);
  const events: HandleMessageStreamEvent[] = [];
  const targetCount = session.streamIndex;

  for await (const event of eveSession.stream({
    startIndex: 0,
    signal: options?.signal,
  })) {
    if (options?.signal?.aborted) {
      break;
    }

    events.push(event);

    if (events.length >= targetCount) {
      break;
    }

    if (isCurrentTurnBoundaryEvent(event) && events.length >= targetCount) {
      break;
    }
  }

  return events;
}
