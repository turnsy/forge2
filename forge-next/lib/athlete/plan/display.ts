import { formatDate } from "@/lib/format/date";
import type { AssignedPlan } from "@/lib/athlete/plan/repository";

export function getAssignedPlanHistoryMeta(plan: AssignedPlan): {
  label: string;
  value: string;
} {
  if (plan.status === "completed") {
    return {
      label: "Completed",
      value: plan.completedAt ? formatDate(plan.completedAt) : "—",
    };
  }

  return {
    label: "Aborted",
    value: plan.unassignedAt ? formatDate(plan.unassignedAt) : "—",
  };
}
