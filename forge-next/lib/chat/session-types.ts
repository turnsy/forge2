import type { ChatMessage } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ChatSessionSnapshot = {
  messages: ChatMessage[];
  currentArtifact: WorkoutPlan | null;
  planId: string | null;
  artifactTitle: string;
  contextFileIds: string[];
};
