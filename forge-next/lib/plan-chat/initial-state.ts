import { createDraftId } from "@/lib/plan-chat/create-draft-id";
import type { PlanChatWorkspaceState } from "@/lib/plan-chat/types";

export function createInitialPlanChatWorkspaceState(
  draftId: string = createDraftId(),
): PlanChatWorkspaceState {
  return {
    draftId,
    hasStarted: false,
    messages: [],
    currentArtifact: null,
    contextFileIds: [],
    attachments: [],
    runStatus: null,
    warnings: [],
    errors: [],
    phase: "idle",
    streamingAssistantText: "",
  };
}
