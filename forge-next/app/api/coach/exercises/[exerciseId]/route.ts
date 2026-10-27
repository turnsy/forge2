import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireApiRole } from "@/lib/auth/api";
import { exerciseUsage, manageExercise } from "@/lib/exercises/library";
import { parseExerciseManagement } from "@/lib/exercises/management-input";
type Context = { params: Promise<{ exerciseId: string }> };

export async function GET(_request: Request, context: Context) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;
  try {
    const usage = await exerciseUsage((await context.params).exerciseId);
    return usage
      ? NextResponse.json(usage)
      : NextResponse.json({ error: "Exercise not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Could not check exercise usage." }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;
  const input = parseExerciseManagement(await request.json().catch(() => null));
  if (!input)
    return NextResponse.json(
      { error: "Enter a name or choose an exercise replacement." },
      { status: 400 },
    );
  try {
    await manageExercise((await context.params).exerciseId, input);
    revalidatePath("/coach", "layout");
    revalidatePath("/athlete", "layout");
    return NextResponse.json({ ok: true });
  } catch (error) {
    const code = (error as { code?: string }).code;
    return NextResponse.json(
      {
        error:
          code === "23505"
            ? "An exercise with that name already exists."
            : code === "22023"
              ? "Choose a different replacement exercise from your library."
              : "Could not update exercise.",
      },
      { status: code === "P0002" ? 404 : code === "23505" ? 409 : code === "22023" ? 400 : 500 },
    );
  }
}
