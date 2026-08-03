import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { savePlanActuals } from "@/lib/athlete/plan/repository";
import { assertEditableChange } from "@/lib/plans/plan-editability";
import { setCoachArtifact } from "../lib/coach-artifact-state";
import { fetchCoachAthleteActiveAssignment } from "../lib/assigned-plans";
import { getCoachId } from "../lib/coach-context";
import { MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN } from "../lib/config";
import { runPlanCodeInSandbox } from "../lib/run-plan-code";
import { reserveSubmitAthletePlanCodeAttempt } from "../lib/submit-athlete-plan-code-attempts";
import type { SubmitAthletePlanCodeOutput } from "@/lib/chat/adapters/plan/forge-tool-outputs";

export default defineTool({
  description:
    `Submit Python source for run.py to edit an athlete's active assigned plan. Load plan-codegen first. Use get_athlete_plan_progress to see what is already logged before editing. Only change sets and days that are not yet completed. At most ${MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN} attempts per user message.`,
  inputSchema: z.object({
    athleteId: z.string().uuid().describe("Athlete profile id."),
    python: z
      .string()
      .min(1)
      .describe(
        "Complete run.py body: Plan.load(), edit via week()/day()/block()/exercise()/set() refs, then plan.save().",
      ),
  }),
  approval: always(),
  async execute({ athleteId, python }, ctx): Promise<SubmitAthletePlanCodeOutput> {
    const turnId = ctx.session.turn.id;
    const attempt = reserveSubmitAthletePlanCodeAttempt(turnId);

    if (!attempt.allowed) {
      return {
        ok: false as const,
        errors: [
          {
            code: "RETRY_LIMIT_EXCEEDED",
            message: `submit_athlete_plan_code was called ${attempt.attempt} times this turn (limit ${MAX_SUBMIT_PLAN_CODE_ATTEMPTS_PER_TURN}). Stop retrying and tell the user you could not update the plan.`,
          },
        ],
      };
    }

    const coachId = getCoachId(ctx);
    const assignmentResult = await fetchCoachAthleteActiveAssignment(
      coachId,
      athleteId,
    );

    if (!assignmentResult.ok) {
      if ("notFound" in assignmentResult) {
        return assignmentResult.notFound;
      }

      return {
        ok: false as const,
        errors: [
          {
            code: assignmentResult.code,
            message: assignmentResult.message,
          },
        ],
      };
    }

    if (!assignmentResult.assignment) {
      return {
        ok: false as const,
        errors: [
          {
            code: "NO_ACTIVE_ASSIGNMENT",
            message: `No active plan assignment for ${assignmentResult.athleteName}.`,
          },
        ],
      };
    }

    const { assignment, athleteName } = assignmentResult;
    const before = assignment.plan;
    const sandbox = await ctx.getSandbox();
    const sandboxResult = await runPlanCodeInSandbox({
      sandbox,
      seed: before,
      python,
    });

    if (!sandboxResult.ok) {
      return sandboxResult;
    }

    const editabilityErrors = assertEditableChange(before, sandboxResult.plan);
    if (editabilityErrors.length > 0) {
      return { ok: false as const, errors: editabilityErrors };
    }

    const saveResult = await savePlanActuals(assignment.id, sandboxResult.plan);
    if (!saveResult.ok) {
      return {
        ok: false as const,
        errors: [
          {
            code: saveResult.code,
            message: saveResult.message,
          },
        ],
      };
    }

    setCoachArtifact({
      plan: sandboxResult.plan,
      planId: null,
      assignment: {
        assignmentId: assignment.id,
        athleteId,
        athleteName,
      },
    });

    return {
      ok: true as const,
      plan: sandboxResult.plan,
      summary: `Updated ${athleteName}'s plan.`,
    };
  },
  toModelOutput(output) {
    if (output.ok) {
      return { type: "text", value: output.summary };
    }
    return { type: "json", value: output };
  },
});
