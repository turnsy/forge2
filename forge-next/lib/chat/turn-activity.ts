import type { ChatStatus, ChatWorkspacePhase } from "@/lib/chat/types";
import { isActiveRunStatus } from "@/lib/chat/run-status-copy";

export const TURN_ACTIVITY_LABEL = "Working";

/** True while the coach workspace turn has not reached a terminal state. */
export function isTurnInProgress(
  phase: ChatWorkspacePhase,
  runStatus: ChatStatus | null,
): boolean {
  if (phase === "error") {
    return false;
  }

  if (
    phase === "initializing" ||
    phase === "uploading" ||
    phase === "streaming"
  ) {
    return true;
  }

  return runStatus !== null && isActiveRunStatus(runStatus);
}

export function shouldShowPreviewSpinner(runStatus: ChatStatus | null): boolean {
  return runStatus !== null && isActiveRunStatus(runStatus);
}
