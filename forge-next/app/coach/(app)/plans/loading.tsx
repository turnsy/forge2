import { PageContent, PageHeader, Spinner } from "@/components/ui";

export default function CoachPlansLoading() {
  return (
    <PageContent>
      <PageHeader title="Plans" />
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner />
      </div>
    </PageContent>
  );
}
