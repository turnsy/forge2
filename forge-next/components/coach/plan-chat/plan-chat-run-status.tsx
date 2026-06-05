import { RunStatusBadge } from "@/components/ui/run-status-badge";
import type { PlanChatRunStatus } from "@/lib/ai/plan-chat/types";
import type { PlanChatDisplayError } from "@/lib/plan-chat/types";

export function PlanChatRunStatus({
  runStatus,
  errors,
  phase,
}: {
  runStatus: PlanChatRunStatus | null;
  errors: PlanChatDisplayError[];
  phase: "idle" | "uploading" | "streaming" | "error";
}) {
  const showErrors = errors.length > 0 && (phase === "error" || phase === "idle");

  if (!runStatus && !showErrors) {
    return null;
  }

  return (
    <div className="flex shrink-0 flex-col gap-2 border-b border-glass-border px-4 py-2">
      <div className="flex items-center gap-2">
        <RunStatusBadge status={runStatus} />
      </div>
      {showErrors ? (
        <ul className="space-y-1 text-sm text-red-300/95" role="alert">
          {errors.map((error, index) => (
            <li key={`${error.message}-${index}`}>
              {error.path ? (
                <span className="font-mono text-xs text-red-200/80">
                  {error.path}:{" "}
                </span>
              ) : null}
              {error.message}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
