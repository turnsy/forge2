import { notFound } from "next/navigation";
import { CoachAthleteDetailActions } from "@/components/coach-athlete-detail-actions";
import { MetaGroup, MetaItem, PageHeader, PageShell } from "@/components/ui";
import { formatDate } from "@/lib/format/date";
import { requireRole } from "@/lib/auth/session";
import { getCoachAthleteRelationship } from "@/lib/links/repository";

export default async function CoachAthleteDetailPage({
  params,
}: {
  params: Promise<{ athleteId: string }>;
}) {
  await requireRole("coach");
  const { athleteId } = await params;
  const relationship = await getCoachAthleteRelationship(athleteId);

  if (!relationship || relationship.status !== "active") {
    notFound();
  }

  return (
    <PageShell back={{ href: "/coach/athletes", ariaLabel: "Back to athletes" }}>
      <PageHeader title={relationship.athleteName} />
      <MetaGroup>
        {relationship.athleteEmail ? (
          <MetaItem label="Email" value={relationship.athleteEmail} />
        ) : null}
        {relationship.linkedAt ? (
          <MetaItem label="Joined" value={formatDate(relationship.linkedAt)} />
        ) : null}
      </MetaGroup>
      <CoachAthleteDetailActions relationship={relationship} />
    </PageShell>
  );
}
