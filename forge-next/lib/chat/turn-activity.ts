import type { ChatStatus, ChatWorkspacePhase } from "@/lib/chat/types";
import {
  getRunStatusLabel,
  isActiveRunStatus,
} from "@/lib/chat/run-status-copy";

export const TURN_ACTIVITY_LABEL = "Working";

export function getTurnActivityLabel(
  phase: ChatWorkspacePhase,
  runStatus: ChatStatus | null,
): string {
  if (phase === "uploading") {
    return "Uploading files…";
  }

  if (runStatus && isActiveRunStatus(runStatus)) {
    return getRunStatusLabel(runStatus);
  }

  if (phase === "streaming" || phase === "initializing") {
    return "Thinking…";
  }

  return TURN_ACTIVITY_LABEL;
}

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
