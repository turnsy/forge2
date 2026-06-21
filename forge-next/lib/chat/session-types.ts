import type { ChatMessage } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type ChatSessionSnapshot = {
  title: string | null;
  messages: ChatMessage[];
  currentArtifact: WorkoutPlan | null;
  planId: string | null;
  artifactTitle: string;
  contextFileIds: string[];
};
