import { isActiveRunStatus } from "@/lib/plan-chat/run-status-copy";
import type { PlanChatWorkspaceState } from "@/lib/plan-chat/types";

export function hasUploadingAttachments(state: PlanChatWorkspaceState): boolean {
  return state.attachments.some(
    (attachment) =>
      attachment.status === "uploading" || attachment.status === "pending",
  );
}

export function canSendPlanChat(state: PlanChatWorkspaceState): boolean {
  if (state.phase === "streaming" || state.phase === "uploading") {
    return false;
  }

  if (hasUploadingAttachments(state)) {
    return false;
  }

  return true;
}

export function isChatRunning(state: PlanChatWorkspaceState): boolean {
  return state.phase === "streaming" || state.phase === "uploading";
}

export function isAwaitingFirstPlan(state: PlanChatWorkspaceState): boolean {
  if (state.currentArtifact || !state.hasStarted) {
    return false;
  }

  if (state.phase === "streaming" || state.phase === "uploading") {
    return true;
  }

  return state.runStatus !== null && isActiveRunStatus(state.runStatus);
}
