import { Suspense } from "react";
import { AthleteList } from "@/components/athlete-list";
import { AthletesPageHeader } from "@/components/athletes-page-header";
import { PageContent, Spinner } from "@/components/ui";
import { listCoachAthletes } from "@/lib/athletes/repository";
import { requireRole } from "@/lib/auth/session";

async function AthletesListSection() {
  await requireRole("coach");
  const athletes = await listCoachAthletes();
  return <AthleteList athletes={athletes} />;
}

function AthletesListFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Spinner />
    </div>
  );
}

export default function CoachAthletesPage() {
  return (
    <PageContent>
      <AthletesPageHeader />
      <Suspense fallback={<AthletesListFallback />}>
        <AthletesListSection />
      </Suspense>
    </PageContent>
  );
}
