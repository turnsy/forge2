import type { SendTurnPayload } from "eve/client";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export const FORGE_CLIENT_CONTEXT_MARKER = "forge";

export type ForgeClientArtifactContext = {
  plan: WorkoutPlan;
  planId?: string | null;
  title?: string;
};

export type ForgeClientContext = {
  forge: typeof FORGE_CLIENT_CONTEXT_MARKER;
  forgeSessionId: string;
  clientArtifact?: ForgeClientArtifactContext | null;
};

export function buildForgeClientContext(input: {
  forgeSessionId: string;
  clientArtifact?: ForgeClientArtifactContext | null;
}): ForgeClientContext {
  return {
    forge: FORGE_CLIENT_CONTEXT_MARKER,
    forgeSessionId: input.forgeSessionId,
    ...(input.clientArtifact ? { clientArtifact: input.clientArtifact } : {}),
  };
}

export function buildForgeClientContextForSend(
  input: Parameters<typeof buildForgeClientContext>[0],
): NonNullable<SendTurnPayload["clientContext"]> {
  return JSON.parse(
    JSON.stringify(buildForgeClientContext(input)),
  ) as NonNullable<SendTurnPayload["clientContext"]>;
}

export function prepareForgeClientSend(
  input: SendTurnPayload,
  context: Parameters<typeof buildForgeClientContext>[0],
): SendTurnPayload {
  if (input.inputResponses?.length && input.message === undefined) {
    // Eve appends clientContext as a user message. AI SDK approval collection
    // requires the approval response to remain the last tool message; a user
    // message here skips execution and leaves a tool call without its output.
    return { ...input, clientContext: undefined };
  }
  return { ...input, clientContext: buildForgeClientContextForSend(context) };
}
