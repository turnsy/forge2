import type { ToolContext } from "eve/tools";
import { FORGE_SESSION_HEADER } from "@/lib/chat/constants";

type AuthAttributes = {
  forgeSessionId?: string;
  email?: string;
  role?: string;
};

export function getCoachId(ctx: ToolContext): string {
  const coachId = ctx.session.auth.current?.principalId;
  if (!coachId) {
    throw new Error("Coach authentication required.");
  }
  return coachId;
}

export function getForgeSessionId(ctx: ToolContext): string {
  const attributes = ctx.session.auth.current?.attributes as
    | AuthAttributes
    | undefined;
  const fromAuth = attributes?.forgeSessionId?.trim();
  if (fromAuth) {
    return fromAuth;
  }

  throw new Error(
    `Missing forge session id. Send ${FORGE_SESSION_HEADER} on eve requests.`,
  );
}
