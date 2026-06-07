import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { createFoundationTools } from "@/lib/ai/coach-agent/tools/foundation-tools";
import {
  createPlanChatTools,
  type PlanChatToolsContext,
} from "@/lib/ai/plan-chat/tools/create-plan-chat-tools";

export type CoachAgentToolsContext = PlanChatToolsContext & {
  currentArtifact: WorkoutPlan | null;
};

export function createCoachAgentTools(ctx: CoachAgentToolsContext) {
  return {
    ...createPlanChatTools(ctx),
    ...createFoundationTools({ currentArtifact: ctx.currentArtifact }),
  };
}
