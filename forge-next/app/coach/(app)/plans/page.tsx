import { Suspense } from "react";
import { PlanList } from "@/components/plan-list";
import { PlansPageHeader } from "@/components/plans-page-header";
import { ListSectionSpinner, PageContent } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { listCoachPlans } from "@/lib/plans/repository";

async function PlansListSection() {
  const user = await requireRole("coach");
  const plans = await listCoachPlans(user.id);
  return <PlanList plans={plans} />;
}

export default function CoachPlansPage() {
  return (
    <PageContent>
      <PlansPageHeader />
      <Suspense fallback={<ListSectionSpinner />}>
        <PlansListSection />
      </Suspense>
    </PageContent>
  );
}
