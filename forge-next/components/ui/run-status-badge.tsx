import {
  getRunStatusLabel,
  isActiveRunStatus,
} from "@/lib/plan-chat/run-status-copy";
import type { PlanChatRunStatus } from "@/lib/ai/plan-chat/types";

export function RunStatusBadge({
  status,
}: {
  status: PlanChatRunStatus | null;
}) {
  if (!status) {
    return null;
  }

  const active = isActiveRunStatus(status);

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
        status === "error"
          ? "border-red-500/40 bg-red-500/10 text-red-200"
          : "border-glass-border bg-glass text-surface-muted"
      }`}
    >
      {active ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coach-muted" />
      ) : null}
      {getRunStatusLabel(status)}
    </span>
  );
}
