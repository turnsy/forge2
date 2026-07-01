import {
  getActiveAthletePlan,
  type AssignedPlan,
} from "@/lib/athlete/plan/repository";
import { getCoachAthleteRelationship } from "@/lib/links/repository";
import { toToolError, toToolNotFound } from "./db-tool-errors";

export type FetchedCoachAthleteAssignment =
  | {
      ok: true;
      athleteName: string;
      assignment: AssignedPlan;
    }
  | {
      ok: true;
      athleteName: string;
      assignment: null;
    }
  | { ok: false; notFound: ReturnType<typeof toToolNotFound> }
  | { ok: false; code: string; message: string };

export async function fetchCoachAthleteActiveAssignment(
  coachId: string,
  athleteId: string,
): Promise<FetchedCoachAthleteAssignment> {
  const relationship = await getCoachAthleteRelationship(athleteId);

  if (!relationship || relationship.status !== "active") {
    return { ok: false, notFound: toToolNotFound("Athlete") };
  }

  const result = await getActiveAthletePlan(athleteId);
  if (!result.ok) {
    return toToolError(result);
  }

  const assignment = result.plan;
  if (assignment && assignment.coachId !== coachId) {
    return { ok: false, notFound: toToolNotFound("Athlete") };
  }

  return {
    ok: true,
    athleteName: relationship.athleteName,
    assignment,
  };
}
