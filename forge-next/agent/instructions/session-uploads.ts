import { defineDynamic, defineInstructions } from "eve/instructions";
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
              markdown:
                "No session uploads are registered for this conversation. You may still call submit_plan_code for prompt-only plans.",
            });
          }

          const paths = await listForgeSessionUploadPaths(
            coachId,
            forgeSessionId,
          );
          if (paths.length > 0) {
            return null;
          }

          return defineInstructions({
            markdown:
              "No session uploads are registered for this conversation. You may still call submit_plan_code for prompt-only plans.",
          });
        } catch {
          return null;
        }
      });
    },
  },
});
