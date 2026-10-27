import { Button, PageHeader } from "@/components/ui";
import {
  milestoneDescription,
  milestoneTitle,
  type AthletePlanMilestone,
} from "@/lib/athlete/plan/milestones";

export function AthletePlanMilestoneView({
  milestone,
  onDismiss,
}: {
  milestone: AthletePlanMilestone;
  onDismiss?: () => void;
}) {
  return (
    <div
      className={`flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center`}
    >
      <PageHeader
        title={milestoneTitle(milestone)}
        description={milestoneDescription(milestone)}
      />
      {onDismiss ? (
        <Button type="button" onClick={onDismiss}>
          Continue
        </Button>
      ) : null}
    </div>
  );
}
