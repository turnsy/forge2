import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { summarizeAssignedPlanProgress } from "@/lib/athlete/plan/summarize-assigned-plan-progress";
import { fetchCoachAthleteActiveAssignment } from "../lib/assigned-plans";
import { getCoachId } from "../lib/coach-context";

export default defineTool({
  description:
    "Get progress on an athlete's active assigned plan. Without week/day: completion %, current position, skipped-day/set counts, and assignment date. With week: day list and status for that week. With week and day: prescribed work, set status, and logged actuals for that day.",
  inputSchema: z.object({
    athleteId: z.string().uuid().describe("Athlete profile id."),
    week: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe("0-based week index (same as plan.week(n))."),
    day: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe(
        "0-based day index within the week. Requires week. Includes reps/target per set when both are provided.",
      ),
  }),
  async execute({ athleteId, week, day }, ctx) {
    const coachId = getCoachId(ctx);
    const result = await fetchCoachAthleteActiveAssignment(coachId, athleteId);

    if (!result.ok) {
      if ("notFound" in result) {
        return result.notFound;
      }

      return {
        ok: false as const,
        code: result.code,
        message: result.message,
      };
    }

    if (!result.assignment) {
      return {
        summary: `No active plan assignment for ${result.athleteName}.`,
      };
    }

    return {
      summary: summarizeAssignedPlanProgress({
        athleteName: result.athleteName,
        assignment: result.assignment,
        week,
        day,
      }),
    };
  },
});
