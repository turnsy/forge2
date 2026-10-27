import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { getCoachId } from "../lib/coach-context";
import { getAccessibleExercise } from "@/lib/exercises/confirm-selection";
import { insertAthleteMax } from "@/lib/maxes/mutations";
export default defineTool({
  description:
    "Set an actively linked athlete's current training max from a value explicitly supplied by the coach. Creates or updates by appending a coach-entered history entry, including decreases. Never invent or estimate a max. Do not write values from a cancelled/skipped input card.",
  inputSchema: z.object({
    athleteId: z.string().uuid(),
    exerciseId: z.string().uuid(),
    value: z.number().finite().positive(),
    unit: z.enum(["kg", "lb"]),
  }),
  async execute({ athleteId, exerciseId, value, unit }, ctx) {
    const coachId = getCoachId(ctx);
    const exercise = await getAccessibleExercise(exerciseId, coachId);
    if (!exercise || exercise.owner_coach_id !== coachId)
      return { ok: false, message: "Select an exercise from your library." };
    const max = await insertAthleteMax({
      athleteId,
      exerciseId,
      value,
      unit,
      source: "coach_entered",
    });
    return { ok: true, max };
  },
});
