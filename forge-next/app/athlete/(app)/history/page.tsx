import { AthletePlanHistoryView } from "@/components/athlete-plan-history-view";
import { ErrorState, PageHeader, PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { listMyPlanHistory } from "@/lib/athlete/plan/repository";
import { MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";

export default async function AthleteHistoryPage() {
  const user = await requireRole("athlete");
  const result = await listMyPlanHistory(user.id);

  return (
    <PageShell back={{ href: "/athlete", ariaLabel: "Back to home" }}>
      <PageHeader title="History" />
      <div className={MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS}>
        {!result.ok ? (
          <ErrorState
            title="Couldn't load history"
            description={result.message}
          />
        ) : (
          <AthletePlanHistoryView plans={result.plans} />
        )}
      </div>
    </PageShell>
  );
}
