import { Radio } from "@/components/ui";
import type { CoachPlanListItem } from "@/lib/plans/types";

export function PlanPickerList({
  plans,
  athleteId,
  selectedPlanId,
  onSelect,
}: {
  plans: CoachPlanListItem[];
  athleteId: string;
  selectedPlanId: string | null;
  onSelect: (planId: string) => void;
}) {
  if (plans.length === 0) {
    return null;
  }

  return (
    <ul className="divide-y divide-glass-border">
      {plans.map((plan) => (
        <li key={plan.id}>
          <label className="flex cursor-pointer items-center gap-3 p-3 transition hover:bg-glass-focus/40">
            <Radio
              name={`assign-plan-${athleteId}`}
              checked={selectedPlanId === plan.id}
              onChange={() => onSelect(plan.id)}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-surface-foreground">
                {plan.title}
              </span>
              <span className="mt-1 block text-xs text-surface-muted">
                {plan.weekCount} week{plan.weekCount === 1 ? "" : "s"}
              </span>
            </span>
          </label>
        </li>
      ))}
    </ul>
  );
}
