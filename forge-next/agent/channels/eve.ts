import {
  type AuthFn,
  ForbiddenError,
  localDev,
  vercelOidc,
} from "eve/channels/auth";
import { eveChannel } from "eve/channels/eve";
import { isPromptBetaEnabled } from "@/lib/prompts/prompt-beta-access";
import {
  getAuthUserFromRequest,
  getForgeSessionIdFromRequest,
} from "../lib/forge-auth";

function forgeCoachAuth(): AuthFn<Request> {
  return async (request) => {
    const user = await getAuthUserFromRequest(request);
    if (!user) {
      return null;
    }

    if (user.role !== "coach") {
      throw new ForbiddenError({ message: "Coach role required." });
    }

    if (!isPromptBetaEnabled(user.email)) {
      throw new ForbiddenError({ message: "Prompt beta not enabled." });
    }

    const forgeSessionId = getForgeSessionIdFromRequest(request);
    const cookieHeader = request.headers.get("cookie") ?? "";

    return {
      principalId: user.id,
      principalType: "user",
      authenticator: "forge",
      attributes: {
        role: user.role,
        email: user.email ?? "",
        cookieHeader,
        ...(forgeSessionId ? { forgeSessionId } : {}),
      },
    };
  };
}

export default eveChannel({
  auth: [forgeCoachAuth(), vercelOidc(), localDev()],
});
