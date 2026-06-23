import type { ChatStatus } from "@/lib/chat/types";
import { isActiveRunStatus } from "@/lib/chat/run-status-copy";

export const STREAM_INTERRUPTED_MESSAGE =
  "The request stopped before finishing. Long plan builds can hit server time limits — try again, or ask for a smaller change first.";

export function isCompletedChatRun(runStatus: ChatStatus | null): boolean {
  return runStatus === "done" || runStatus === "error";
}

export function wasChatRunInterrupted(runStatus: ChatStatus | null): boolean {
  if (runStatus === null) {
    return true;
  }

  return isActiveRunStatus(runStatus);
}
