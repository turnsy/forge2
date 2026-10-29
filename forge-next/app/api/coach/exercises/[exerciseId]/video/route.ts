import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { createClient } from "@/utils/supabase/server";
import { exerciseVideoInput } from "@/lib/exercises/video-url";

export async function POST(
  request: Request,
  context: { params: Promise<{ exerciseId: string }> },
) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) return auth.response;
  const input = exerciseVideoInput.safeParse(
    await request.json().catch(() => null),
  );
  if (!input.success)
    return NextResponse.json(
      { error: "Enter a valid http or https video URL." },
      { status: 400 },
    );
  const db = await createClient();
  const { exerciseId } = await context.params;
  const { error } = await db.rpc("set_coach_exercise_video", {
    p_exercise_id: exerciseId,
    p_video_url: input.data.videoUrl || null,
  });
  if (error)
    return NextResponse.json(
      { error: "Could not save exercise video." },
      { status: error.code === "P0002" ? 404 : 500 },
    );
  return NextResponse.json({ videoUrl: input.data.videoUrl || null });
}
