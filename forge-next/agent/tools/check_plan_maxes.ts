import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { getCoachId } from "../lib/coach-context";
import { fetchCoachPlanForTool } from "../lib/plans";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { percentageMaxRequirements } from "@/lib/maxes/plan-requirements";
import { listAthleteMaxes } from "@/lib/maxes/mutations";
import { buildMaxesByExerciseId } from "@/lib/maxes/build-maxes-map";

export default defineTool({
  description:
    "Before assigning a plan, check max coverage for ONLY exercises with percentage prescriptions, using their actual basis exercise. Returns missing maxInputs ready for ask_question. Advisory: the coach may skip entering maxes and still assign.",
  inputSchema: z.object({
    planId: z.string().uuid(),
    athleteIds: z.array(z.string().uuid()).min(1).max(100),
  }),
  async execute({ planId, athleteIds }, ctx) {
    const coachId = getCoachId(ctx);
    const plan = await fetchCoachPlanForTool(coachId, planId);
    if (!plan.ok) return plan;
    const required = percentageMaxRequirements(plan.detail.plan);
    const athletes = [];
    const maxInputs = [];
    for (const athleteId of [...new Set(athleteIds)]) {
      const link = await getCoachAthleteRelationship(athleteId);
      if (!link || link.status !== "active")
        return { ok: false, message: "Athlete not found or not actively linked." };
      const map = required.length
        ? buildMaxesByExerciseId(
            await listAthleteMaxes(
              athleteId,
              required.map((item) => item.exerciseId),
            ),
          )
        : {};
      const requirements = required.map((item) => ({
        ...item,
        currentMax: map[item.exerciseId] ?? null,
      }));
      athletes.push({ athleteId, athleteName: link.athleteName, requirements });
      for (const item of requirements)
        if (!item.currentMax)
          maxInputs.push({
            id: `${athleteId}:${item.exerciseId}`,
            label: `${link.athleteName} · ${item.exerciseName}`.slice(0, 300),
            athleteId,
            exerciseId: item.exerciseId,
            unit: "kg",
          });
    }
    return {
      ok: true,
      athletes,
      maxInputs: maxInputs.slice(0, 100),
      remainingMaxCount: Math.max(0, maxInputs.length - 100),
      canAssignWithoutMaxes: true,
    };
  },
});
