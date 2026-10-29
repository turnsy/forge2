import { z } from "zod";
import { revalidatePath } from "next/cache";
import {
  metadataIdentity,
  answersSchema,
  errorResponse,
} from "@/lib/metadata/http";
import {
  getMetadata,
  listFields,
  saveField,
  setMetadata,
  metadataHistory,
  listMetadataAthletes,
} from "@/lib/metadata/repository";
import { validateDefinition } from "@/lib/metadata/domain";
import { filterSchema } from "@/lib/metadata/filters";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const athleteId = params.get("athleteId") ?? undefined;
    const identity = await metadataIdentity(athleteId);
    if (params.get("history") === "true" && identity.athleteId)
      return Response.json({
        events: await metadataHistory(
          identity.coachId,
          identity.athleteId,
          params.has("before")
            ? z.coerce.number().int().positive().parse(params.get("before"))
            : undefined,
        ),
        fields: await listFields(identity.coachId, true),
      });
    if (identity.athleteId)
      return Response.json(
        await getMetadata(identity.coachId, identity.athleteId),
      );
    return Response.json({ fields: await listFields(identity.coachId, true) });
  } catch (error) {
    return errorResponse(error);
  }
}
const mutation = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("field"),
    definition: z.unknown(),
    id: z.string().uuid().optional(),
    version: z.number().int().positive().optional(),
  }),
  z.object({
    op: z.literal("values"),
    athleteId: z.string().uuid().optional(),
    answers: answersSchema,
  }),
  z.object({
    op: z.literal("search"),
    filters: z.array(filterSchema).max(30),
    q: z.string().optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().min(1).max(100).optional(),
    incomplete: z.boolean().optional(),
    status: z.enum(["active", "pending"]).optional(),
    includeMetadata: z.boolean().optional(),
  }),
]);
export async function POST(request: Request) {
  try {
    const input = mutation.parse(await request.json());
    const identity = await metadataIdentity(
      input.op === "values" ? input.athleteId : undefined,
    );
    if (input.op === "search") {
      if (identity.user.role !== "coach") throw new Error("Forbidden");
      return Response.json(await listMetadataAthletes(identity.coachId, input));
    }
    let result;
    if (input.op === "field") {
      if (identity.user.role !== "coach") throw new Error("Forbidden");
      result = await saveField(
        identity.coachId,
        validateDefinition(input.definition),
        input.id,
        input.version,
      );
    } else {
      if (!identity.athleteId) throw new Error("Select an athlete");
      result = await setMetadata(
        identity.coachId,
        identity.athleteId,
        input.answers,
      );
    }
    revalidatePath("/coach", "layout");
    revalidatePath("/athlete", "layout");
    return Response.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
