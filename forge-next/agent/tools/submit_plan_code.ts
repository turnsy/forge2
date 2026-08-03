import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { coachArtifact, setCoachArtifact } from "../lib/coach-artifact-state";
import { MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN } from "../lib/config";
import { runPlanCodeInSandbox } from "../lib/run-plan-code";
import { reserveSubmitPlanCodeAttempt } from "../lib/submit-plan-code-attempts";
import type { SubmitPlanCodeOutput } from "@/lib/chat/adapters/plan/forge-tool-outputs";

export default defineTool({
  description:
    `Submit the full Python source for run.py to create or update the workout plan. When the user already specified program scope (weeks, days per week, etc.), implement the entire requested structure in this one script (use loops); do not stop after week 1 or day 1 and ask to continue. The server runs the sandbox immediately and returns { ok, errors } so you can fix and resubmit in the same turn. At most ${MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN} attempts per user message; after that, stop retrying and explain the blocker briefly to the user.`,
  inputSchema: z.object({
    python: z
      .string()
      .min(1)
      .describe(
        "Complete run.py body: use Plan.load(), build all requested weeks/days/exercises, then plan.save().",
      ),
  }),
  async execute({ python }, ctx): Promise<SubmitPlanCodeOutput> {
    const turnId = ctx.session.turn.id;
    const attempt = reserveSubmitPlanCodeAttempt(turnId);

    if (!attempt.allowed) {
      return {
        ok: false as const,
        errors: [
          {
            code: "RETRY_LIMIT_EXCEEDED",
            message: `submit_plan_code was called ${attempt.attempt} times this turn (limit ${MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN}). Stop retrying and tell the user you could not build the plan.`,
          },
        ],
      };
    }

    const sandbox = await ctx.getSandbox();
    const result = await runPlanCodeInSandbox({
      sandbox,
      seed: coachArtifact.get().plan,
      python,
    });

    if (!result.ok) {
      return result;
    }

    setCoachArtifact({ plan: result.plan });
    return {
      ok: true as const,
      plan: result.plan,
      title: result.plan.name,
    };
  },
  toModelOutput(output) {
    if (output.ok) {
      return { type: "text", value: "Preview updated." };
    }
    return { type: "json", value: output };
  },
});
