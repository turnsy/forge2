import { defineForgeTool as defineTool } from "../lib/define-forge-tool";
import { z } from "zod";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { searchAthleteMaxes } from "@/lib/maxes/search-athlete-maxes";
import { getCoachId } from "../lib/coach-context";
import { toToolNotFound } from "../lib/db-tool-errors";

export default defineTool({
  description:
    "Fuzzy-search an athlete's recorded maxes by exercise name. Returns current best values grouped by exercise, ranked by match quality. Use when a coach asks about an athlete's bench/squat/etc max without knowing the exact exercise id.",
  inputSchema: z.object({
    athleteId: z.string().uuid().describe("Athlete profile id."),
    query: z
      .string()
      .trim()
      .min(1)
      .describe("Exercise name or partial name to search, e.g. bench or squat."),
    limit: z.number().int().min(1).max(20).optional().describe("Max results (default 10)."),
  }),
  async execute({ athleteId, query, limit = 10 }, ctx) {
    getCoachId(ctx);
    const relationship = await getCoachAthleteRelationship(athleteId);

    if (!relationship) {
      return toToolNotFound("Athlete");
    }

    const results = await searchAthleteMaxes(athleteId, query, limit);

    return {
      ok: true as const,
      athleteId,
      query,
      items: results.map((item) => ({
        exerciseId: item.exerciseId,
        exerciseName: item.exerciseName,
        currentMax: {
          id: item.currentMaxId,
          value: item.currentValue,
          unit: item.currentUnit,
          loggedAt: item.loggedAt,
        },
        historyCount: item.history.length,
        matchScore: item.score,
      })),
      total: results.length,
    };
  },
});
