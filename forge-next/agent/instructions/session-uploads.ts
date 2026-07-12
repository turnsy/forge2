import { defineDynamic, defineInstructions } from "eve/instructions";
import {
  buildNoSessionUploadsInstructions,
  buildSessionUploadsPresentInstructions,
} from "../lib/session-upload-instructions";
import { withForgeDbContextAsync } from "../lib/with-forge-db";
import { listForgeSessionUploadPaths } from "../lib/uploads";

export default defineDynamic({
  events: {
    "turn.started": async (_event, ctx) => {
      return withForgeDbContextAsync(ctx, async () => {
        try {
          const coachId = ctx.session.auth.current?.principalId;
          const forgeSessionId = (
            ctx.session.auth.current?.attributes as
              | { forgeSessionId?: string }
              | undefined
          )?.forgeSessionId;

          if (!coachId || !forgeSessionId) {
            return defineInstructions({
              markdown: buildNoSessionUploadsInstructions(),
            });
          }

          const paths = await listForgeSessionUploadPaths(
            coachId,
            forgeSessionId,
          );
          if (paths.length > 0) {
            return defineInstructions({
              markdown: buildSessionUploadsPresentInstructions(paths),
            });
          }

          return defineInstructions({
            markdown: buildNoSessionUploadsInstructions(),
          });
        } catch {
          return null;
        }
      });
    },
  },
});
