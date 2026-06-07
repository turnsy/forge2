import { notFound } from "next/navigation";
import { CoachAthleteDetailActions } from "@/components/coach-athlete-detail-actions";
import { CoachAthletePlanActions } from "@/components/coach-athlete-plan-actions";
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
        <MetaItem
          label="Current plan"
          value={relationship.currentPlanName ?? "No plan"}
        />
      </MetaGroup>
      <div className="mt-6 flex flex-wrap gap-3">
        <CoachAthletePlanActions relationship={relationship} />
        <CoachAthleteDetailActions relationship={relationship} />
      </div>
    </PageShell>
  );
}
