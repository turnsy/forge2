import { formatDate } from "@/lib/format/date";
import type { AssignedPlan } from "@/lib/athlete/plan/repository";

export function getAssignedPlanHistoryMeta(plan: AssignedPlan): {
  label: string;
  value: string;
} {
  const endDate =
    plan.status === "completed" ? plan.completedAt : plan.unassignedAt;

  return {
    label: "Completed",
    value: endDate ? formatDate(endDate) : "—",
  };
}
