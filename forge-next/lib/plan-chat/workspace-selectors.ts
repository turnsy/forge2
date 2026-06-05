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
