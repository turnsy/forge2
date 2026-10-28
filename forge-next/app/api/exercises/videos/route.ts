import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";
import { exerciseVideoIds } from "@/lib/exercises/video-url";

export async function POST(request: Request) {
  if (!(await getAuthUser()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = exerciseVideoIds.safeParse(
    await request.json().catch(() => null),
  );
  if (!input.success)
    return NextResponse.json(
      { error: "Invalid exercise IDs." },
      { status: 400 },
    );
  const db = await createClient();
  // RLS limits this batch to exercises the caller can read.
  const { data, error } = await db
    .from("exercises")
    .select("id,video_url")
    .in("id", [...new Set(input.data.ids)]);
  if (error)
    return NextResponse.json(
      { error: "Could not load exercise videos." },
      { status: 500 },
    );
  return NextResponse.json({
    videos: Object.fromEntries((data ?? []).map((e) => [e.id, e.video_url])),
  });
}
