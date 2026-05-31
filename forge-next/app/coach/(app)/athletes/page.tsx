import { Suspense } from "react";
import { AthleteList } from "@/components/athlete-list";
import { AthletesPageHeader } from "@/components/athletes-page-header";
import { ListSectionSpinner, PageContent } from "@/components/ui";
import { listCoachAthletes } from "@/lib/athletes/repository";

async function AthletesListSection() {
  const athletes = await listCoachAthletes();
  return <AthleteList athletes={athletes} />;
}

export default function CoachAthletesPage() {
  return (
    <PageContent>
      <AthletesPageHeader />
      <Suspense fallback={<ListSectionSpinner />}>
        <AthletesListSection />
      </Suspense>
    </PageContent>
  );
}
