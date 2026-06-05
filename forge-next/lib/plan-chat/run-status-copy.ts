import type { PlanChatRunStatus } from "@/lib/ai/plan-chat/types";

const LABELS: Record<PlanChatRunStatus, string> = {
  parsing: "Parsing",
  generating: "Generating",
  sandbox: "Running plan builder",
  validating: "Validating plan",
  done: "Done",
  error: "Error",
};

export function getRunStatusLabel(status: PlanChatRunStatus): string {
  return LABELS[status];
}

export function isActiveRunStatus(status: PlanChatRunStatus): boolean {
  return status !== "done" && status !== "error";
}

export function shouldShowPreviewSpinner(status: PlanChatRunStatus | null): boolean {
  return status === "sandbox" || status === "validating";
}
