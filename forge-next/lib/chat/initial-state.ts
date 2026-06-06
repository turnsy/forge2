import { createDraftId } from "@/lib/chat/utils";
import type { ChatWorkspaceState } from "@/lib/chat/types";

export function createInitialChatWorkspaceState<TArtifact = unknown>(
  draftId: string = createDraftId(),
): ChatWorkspaceState<TArtifact> {
  return {
    draftId,
    hasStarted: false,
    artifactTitle: "",
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
