import { createSessionId } from "@/lib/chat/utils";
import type { ChatWorkspaceState } from "@/lib/chat/types";

export function createInitialChatWorkspaceState<TArtifact = unknown>(
  sessionId: string = createSessionId(),
): ChatWorkspaceState<TArtifact> {
  return {
    sessionId,
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
