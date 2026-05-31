import { PageContent, PageHeader } from "@/components/ui";

export default async function CoachAthleteDetailPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  const { athleteId } = await params;

  return (
    <PageContent>
      <PageHeader title="Athlete" />
      <p className="text-sm text-surface-muted">Athlete ID: {athleteId}</p>
    </PageContent>
  );
}
