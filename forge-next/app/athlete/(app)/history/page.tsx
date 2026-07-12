import { AthletePlanHistoryView } from "@/components/athlete-plan-history-view";
import { ErrorState, PageHeader, PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { listMyPlanHistory } from "@/lib/athlete/plan/repository";

export default async function AthleteHistoryPage() {
  const user = await requireRole("athlete");
  const result = await listMyPlanHistory(user.id);

  return (
    <PageShell
      back={{ href: "/athlete", ariaLabel: "Back to home" }}
      showMobileBack={false}
      header={
        <div className="hidden md:block">
          <PageHeader title="History" />
        </div>
      }
    >
      {!result.ok ? (
        <ErrorState
          title="Couldn't load history"
          description={result.message}
        />
      ) : (
        <AthletePlanHistoryView plans={result.plans} />
      )}
    </PageShell>
  );
}
