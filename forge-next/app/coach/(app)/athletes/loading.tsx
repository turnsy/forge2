import { PageContent, PageHeader, Spinner } from "@/components/ui";

export default function CoachAthletesLoading() {
  return (
    <PageContent>
      <PageHeader title="Athletes" />
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    </PageContent>
  );
}
