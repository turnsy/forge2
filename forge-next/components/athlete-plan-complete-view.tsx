import { ButtonLink, PageHeader } from "@/components/ui";
import { MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";

export function AthletePlanCompleteView({
  planName,
  coachName,
}: {
  planName: string;
  coachName: string;
}) {
  return (
    <div
      className={`flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center ${MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS}`}
    >
      <PageHeader
        title="All workouts complete! 🎉"
        description={`${planName} with ${coachName}`}
      />
      <ButtonLink href="/athlete" variant="primary" size="md">
        Back to Home
      </ButtonLink>
    </div>
  );
}
