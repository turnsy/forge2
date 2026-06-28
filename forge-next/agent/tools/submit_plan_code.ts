import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { loadWorkoutPlan } from "@/lib/plans/validate";
import {
  clearCoachArtifact,
  coachArtifact,
  setCoachArtifact,
} from "../lib/coach-artifact-state";
import { getCoachId, getForgeSessionId } from "../lib/coach-context";
import {
  CURRENT_PLAN_PATH,
  EMPTY_PLAN_SEED,
  OUTPUT_PLAN_PATH,
  RUN_SCRIPT_PATH,
} from "../lib/constants";
import { logSubmittedPlanCode } from "../lib/log-submitted-code";

export default defineTool({
  description:
    "Submit the full Python source for run.py to create or update the workout plan. When the user already specified program scope (weeks, days per week, etc.), implement the entire requested structure in this one script (use loops); do not stop after week 1 or day 1 and ask to continue. The server runs the sandbox immediately and returns { ok, errors } so you can fix and resubmit in the same turn.",
  inputSchema: z.object({
    python: z
      .string()
      .min(1)
      .describe(
        "Complete run.py body: load seed, build all requested weeks/days/exercises, write output/plan.json.",
      ),
  }),
  async execute({ python }, ctx) {
    const coachId = getCoachId(ctx);
    const forgeSessionId = getForgeSessionId(ctx);

    logSubmittedPlanCode(python, {
      coachId,
      sessionId: forgeSessionId,
    });

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
      return { type: "text", value: "Plan updated successfully." };
    }
    return { type: "json", value: output };
  },
});
