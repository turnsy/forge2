import { AthletesPageHeader } from "@/components/athletes-page-header";
import { PageContent, Spinner } from "@/components/ui";

export default function CoachAthletesLoading() {
  return (
    <PageContent>
      <AthletesPageHeader />
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    </PageContent>
  );
}
