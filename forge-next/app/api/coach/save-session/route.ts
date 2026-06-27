import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api";
import { saveChatSession } from "@/lib/chat/session-storage";
import type { ChatSessionSnapshot } from "@/lib/chat/session-types";
import { snapshotHasConversation } from "@/lib/chat/snapshot-messages";

type SaveSessionBody = {
  sessionId?: string;
  snapshot?: ChatSessionSnapshot;
};

export async function POST(request: Request) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) {
    return auth.response;
  }

  let body: SaveSessionBody;
  try {
    body = (await request.json()) as SaveSessionBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { sessionId, snapshot } = body;
  if (!sessionId || !snapshot) {
    return NextResponse.json(
      { ok: false, message: "sessionId and snapshot are required." },
      { status: 400 },
    );
  }

  if (!snapshotHasConversation(snapshot)) {
    return NextResponse.json({ ok: true });
  }

  const result = await saveChatSession(auth.user.id, sessionId, snapshot, {
    generateTitle: false,
  });
  if (result.status === "error") {
    return NextResponse.json(
      { ok: false, message: result.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
