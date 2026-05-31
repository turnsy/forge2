import { PlansPageHeader } from "@/components/plans-page-header";
import { PageContent, Spinner } from "@/components/ui";

export default function CoachPlansLoading() {
  return (
    <PageContent>
      <PlansPageHeader />
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    </PageContent>
  );
}
