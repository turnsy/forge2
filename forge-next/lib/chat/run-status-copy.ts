import type { ChatStatus } from "@/lib/chat/types";

const LABELS: Record<ChatStatus, string> = {
  parsing: "Parsing",
  generating: "Generating",
  sandbox: "Running builder",
  validating: "Validating",
  done: "Done",
  error: "Error",
};

export function getRunStatusLabel(status: ChatStatus): string {
  return LABELS[status];
}

export function isActiveRunStatus(status: ChatStatus): boolean {
  return status !== "done" && status !== "error";
}

export function shouldShowPreviewSpinner(status: ChatStatus | null): boolean {
  return status === "sandbox" || status === "validating";
}
