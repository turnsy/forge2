import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import {
  coachArtifact,
  setCoachArtifact,
} from "../lib/coach-artifact-state";
import {
  CURRENT_PLAN_PATH,
  EMPTY_PLAN_SEED,
  MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN,
  OUTPUT_PLAN_PATH,
  RUN_SCRIPT_PATH,
} from "../lib/config";
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
    const currentPlan = coachArtifact.get().plan;

    await sandbox.writeTextFile({
      path: CURRENT_PLAN_PATH,
      content: JSON.stringify(currentPlan ?? EMPTY_PLAN_SEED),
    });
    await sandbox.writeTextFile({ path: RUN_SCRIPT_PATH, content: python });
    await sandbox.run({ command: "mkdir -p output" });

    const result = await sandbox.run({ command: "python3 run.py" });
    if (result.exitCode !== 0) {
      const detail = [result.stderr?.trim(), result.stdout?.trim()]
        .filter(Boolean)
        .join("\n");
      return {
        ok: false as const,
        errors: [
          {
            code: "SANDBOX_FAILED",
            message: detail || "Sandbox execution failed.",
          },
        ],
      };
    }

    let rawOutput: string | null;
    try {
      rawOutput = await sandbox.readTextFile({ path: OUTPUT_PLAN_PATH });
    } catch {
      return {
        ok: false as const,
        errors: [
          {
            code: "MISSING_OUTPUT",
            message: "Sandbox did not produce output/plan.json.",
          },
        ],
      };
    }

    if (!rawOutput) {
      return {
        ok: false as const,
        errors: [
          {
            code: "MISSING_OUTPUT",
            message: "Sandbox did not produce output/plan.json.",
          },
        ],
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawOutput);
    } catch {
      return {
        ok: false as const,
        errors: [
          {
            code: "INVALID_JSON",
            message: "output/plan.json was not valid JSON.",
          },
        ],
      };
    }

    const validated = loadWorkoutPlan(parsed);
    if (!validated.ok) {
      return { ok: false as const, errors: validated.errors };
    }

    setCoachArtifact({ plan: validated.plan });
    return {
      ok: true as const,
      plan: validated.plan,
      title: validated.plan.name,
    };
  },
  toModelOutput(output) {
    if (output.ok) {
      return { type: "text", value: "Preview updated." };
    }
    return { type: "json", value: output };
  },
});
