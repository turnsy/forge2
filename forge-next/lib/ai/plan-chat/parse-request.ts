import { loadWorkoutPlan } from "@/lib/plans/validate";
import type {
  PlanChatMessage,
  PlanChatRequestBody,
} from "@/lib/ai/plan-chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ParsedPlanChatRequest =
  | {
      ok: true;
      draftId?: string;
      prompt: string;
      messages: PlanChatMessage[];
      currentArtifact: WorkoutPlan | null;
      contextFileIds?: string[];
    }
  | { ok: false; message: string };

function parseMessages(value: unknown): PlanChatMessage[] | null {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  for (const entry of value) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      (entry.role !== "user" && entry.role !== "assistant") ||
      typeof entry.content !== "string"
    ) {
      return null;
    }
  }

  return value as PlanChatMessage[];
}

export function parsePlanChatRequestBody(
  body: unknown,
): ParsedPlanChatRequest {
  if (typeof body !== "object" || body === null) {
    return { ok: false, message: "Invalid JSON body." };
  }

  const record = body as PlanChatRequestBody;

  if (typeof record.prompt !== "string" || record.prompt.trim().length === 0) {
    return { ok: false, message: "prompt is required." };
  }

  if (record.draftId !== undefined && typeof record.draftId !== "string") {
    return { ok: false, message: "draftId must be a string when provided." };
  }

  const messages = parseMessages(record.messages);
  if (messages === null) {
    return { ok: false, message: "messages must be an array of { role, content }." };
  }

  let currentArtifact: WorkoutPlan | null = null;
  if (record.currentArtifact !== undefined && record.currentArtifact !== null) {
    const validated = loadWorkoutPlan(record.currentArtifact);
    if (!validated.ok) {
      return { ok: false, message: "currentArtifact failed validation." };
    }
    currentArtifact = validated.plan;
  }

  if (record.contextFileIds !== undefined) {
    if (
      !Array.isArray(record.contextFileIds) ||
      record.contextFileIds.some((id) => typeof id !== "string")
    ) {
      return { ok: false, message: "contextFileIds must be an array of strings." };
    }
  }

  return {
    ok: true,
    draftId: record.draftId?.trim() || undefined,
    prompt: record.prompt.trim(),
    messages,
    currentArtifact,
    contextFileIds: record.contextFileIds,
  };
}
