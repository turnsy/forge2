export {
  applyChatEvent,
  canSendChat,
  createDraftId,
  formatAttachmentDisplayLabel,
  getRunStatusLabel,
  isActiveRunStatus,
  isAwaitingFirstArtifact,
  isChatRunning,
  shouldShowPreviewSpinner,
} from "@/lib/chat";
export { mapPlanChatEvent } from "@/lib/plan-chat/map-plan-chat-event";
export {
  extractSseEventsFromBuffer,
  parseSseDataLine,
  readPlanChatSseStream,
} from "@/lib/plan-chat/parse-plan-chat-sse";
export { uploadContextFile } from "@/lib/plan-chat/upload-context-client";
export { streamPlanChat } from "@/lib/plan-chat/plan-chat-client";
export { validateClientFiles } from "@/lib/plan-chat/validate-client-files";
export { useCoachPlanWorkspace } from "@/lib/plan-chat/use-coach-plan-workspace";
export {
  toArtifactPreviewModel,
  type ArtifactPreviewModel,
} from "@/lib/plan-chat/artifact-preview";
export type { PlanWorkspaceState } from "@/lib/plan-chat/types";

// Plan-scoped aliases for coach plan workspace call sites
export {
  canSendChat as canSendPlanChat,
  isAwaitingFirstArtifact as isAwaitingFirstPlan,
} from "@/lib/chat";
