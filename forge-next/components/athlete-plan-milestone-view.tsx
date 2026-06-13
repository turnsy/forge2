import { PageHeader } from "@/components/ui";
import {
  milestoneDescription,
  milestoneTitle,
  type AthletePlanMilestone,
} from "@/lib/athlete/plan/milestones";
import { MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";

export function AthletePlanMilestoneView({
  milestone,
}: {
  milestone: AthletePlanMilestone;
}) {
  return (
    <div
      className={`flex min-h-[60vh] flex-col items-center justify-center text-center ${MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS}`}
    >
      <PageHeader
        title={milestoneTitle(milestone)}
        description={milestoneDescription(milestone)}
      />
    </div>
  );
}
