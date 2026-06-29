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
