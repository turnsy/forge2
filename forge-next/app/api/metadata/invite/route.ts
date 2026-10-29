import { z } from "zod";
import { requireApiRole } from "@/lib/auth/api";
import { createClient } from "@/utils/supabase/data-client";
import { answersSchema, errorResponse } from "@/lib/metadata/http";
import { validateValue, type Field } from "@/lib/metadata/domain";
import { revalidatePath } from "next/cache";
export async function POST(request: Request) {
  const auth = await requireApiRole("athlete");
  if (!auth.ok) return auth.response;
  try {
    const input = z
      .object({
        code: z.string().trim().min(1).max(30),
        answers: answersSchema.optional(),
      })
      .parse(await request.json());
    const db = await createClient();
    const { data, error } = await db.rpc("get_metadata_invite_fields", {
      p_code: input.code,
    });
    if (error) throw new Error(error.message);
    const preview = data as { fields: Field[] };
    if (input.answers === undefined) return Response.json(preview);
    const answers = input.answers.map((a) => {
      const f = preview.fields.find(
        (f) => f.id === a.fieldId && f.version === a.version,
      );
      if (!f)
        throw new Error(
          "Field changed. Go back and reload the coach questions.",
        );
      return { ...a, value: validateValue(f, a.value) };
    });
    const { error: saveError } = await db.rpc(
      "request_coach_link_with_metadata",
      { p_code: input.code, p_answers: answers },
    );
    if (saveError) throw new Error(saveError.message);
    revalidatePath("/athlete", "layout");
    revalidatePath("/coach/athletes");
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
