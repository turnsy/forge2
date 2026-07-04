import { Client } from "eve/client";
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
