import { Client, type ClientSession, type MessageResponse, type SendTurnInput } from "eve/client";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";

export function createForgeEveClient(forgeSessionId: string): Client {
  return new Client({
    host: "",
    preserveCompletedSessions: true,
    headers: () => ({
      [FORGE_SESSION_HEADER]: forgeSessionId,
    }),
  });
}

export type ForgeEvePostResponse = {
  sessionId: string;
  continuationToken?: string;
};

/**
 * Intercepts {@link ClientSession.send} so callers can react to POST metadata
 * (sessionId, continuationToken) before the event stream finishes.
 */
export function bindForgeEveSessionSend(
  session: ClientSession,
  onPostResponse: (response: ForgeEvePostResponse) => void,
): ClientSession {
  const originalSend = session.send.bind(session);

  const wrappedSend = async <TOutput = unknown>(
    input: SendTurnInput<TOutput>,
  ): Promise<MessageResponse<TOutput>> => {
    const response = await originalSend(input);
    onPostResponse({
      sessionId: response.sessionId,
      continuationToken: response.continuationToken,
    });
    return response;
  };

  return Object.assign(session, { send: wrappedSend });
}
