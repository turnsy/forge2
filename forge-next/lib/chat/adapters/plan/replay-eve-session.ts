import { Client } from "eve/client";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";

export async function replayEveSessionEvents(
  session: SessionState,
  forgeSessionId: string,
): Promise<HandleMessageStreamEvent[]> {
  if (!session.sessionId) {
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

  for await (const event of eveSession.stream()) {
    events.push(event);
  }

  return events;
}
