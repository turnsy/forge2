import { requireApiRole } from "@/lib/auth/api";
import {
  createPlanChatEventStream,
  parsePlanChatRequestBody,
  PLAN_CHAT_STREAM_HEADERS,
  runPlanChat,
} from "@/lib/ai/plan-chat";
import { isPromptBetaEnabled } from "@/lib/prompts/prompt-beta-access";

export async function POST(request: Request) {
  const auth = await requireApiRole("coach");
  if (!auth.ok) {
    return auth.response;
  }

  if (!isPromptBetaEnabled(auth.user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "PARSE_FAILED", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const parsed = parsePlanChatRequestBody(body);
  if (!parsed.ok) {
    return Response.json(
      { ok: false, error: "INVALID_BODY", message: parsed.message },
      { status: 400 },
    );
  }

  const stream = createPlanChatEventStream((emit) =>
    runPlanChat({
      coachId: auth.user.id,
      sessionId: parsed.sessionId,
      prompt: parsed.prompt,
      messages: parsed.messages,
      currentArtifact: parsed.currentArtifact,
      emit,
    }),
  );

  return new Response(stream, { headers: PLAN_CHAT_STREAM_HEADERS });
}
