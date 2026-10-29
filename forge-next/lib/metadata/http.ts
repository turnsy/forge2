export { valueSchema, answersSchema } from "./input-schema";
import { getAuthUser } from "@/lib/auth/session";
import { getAthleteCoachLink } from "@/lib/links/repository";
export async function metadataIdentity(athleteId?: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  if (user.role === "coach") return { user, coachId: user.id, athleteId };
  if (user.role !== "athlete") throw new Error("Forbidden");
  if (athleteId && athleteId !== user.id) throw new Error("Forbidden");
  const link = await getAthleteCoachLink();
  if (!link) throw new Error("No coach connection");
  return { user, coachId: link.coachId, athleteId: user.id };
}
export function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed";
  return Response.json(
    { error: message },
    {
      status:
        message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400,
    },
  );
}
