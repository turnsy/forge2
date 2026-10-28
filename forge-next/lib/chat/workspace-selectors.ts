import { isActiveRunStatus } from "@/lib/chat/run-status-copy";
import type { ChatWorkspaceState } from "@/lib/chat/types";

export function hasUploadingAttachments<TArtifact>(
  state: ChatWorkspaceState<TArtifact>,
): boolean {
  return state.attachments.some(
    (attachment) =>
      attachment.status === "uploading" || attachment.status === "pending",
  );
}

export function canSendChat<TArtifact>(state: ChatWorkspaceState<TArtifact>): boolean {
  if (
    state.phase === "initializing" ||
    state.phase === "streaming" ||
    state.phase === "uploading"
  ) {
    return false;
  }

  if (hasUploadingAttachments(state)) {
    return false;
  }

  return true;
}

export function isChatRunning<TArtifact>(state: ChatWorkspaceState<TArtifact>): boolean {
  return (
    state.phase === "streaming" ||
    state.phase === "uploading" ||
    state.phase === "initializing"
  );
}

export function canStopChat<TArtifact>(state: ChatWorkspaceState<TArtifact>): boolean {
  if (state.phase === "initializing" || state.phase === "uploading") {
    return false;
  }

  return (
    state.phase === "streaming" ||
    (state.runStatus !== null && isActiveRunStatus(state.runStatus))
  );
}

export function isAwaitingFirstArtifact<TArtifact>(
  state: ChatWorkspaceState<TArtifact>,
): boolean {
  if (state.currentArtifact || !state.hasStarted) {
    return false;
  }

  if (state.phase === "streaming" || state.phase === "uploading") {
    return true;
  }

  return state.runStatus !== null && isActiveRunStatus(state.runStatus);
}
