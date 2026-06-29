import { defineDynamic } from "eve/tools";
import {
  extractForgeClientContextFromMessages,
  syncCoachArtifactFromClientContext,
} from "../lib/forge-client-context";

export default defineDynamic({
  events: {
    "turn.started": async (_event, ctx) => {
      const forgeContext = extractForgeClientContextFromMessages(ctx.messages);
      if (!forgeContext) {
        return null;
      }

      syncCoachArtifactFromClientContext(forgeContext);
      return null;
    },
  },
});
