import { notFound } from "next/navigation";
import { MaxesEditor } from "@/components/maxes-editor";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { getCoachAthleteRelationship } from "@/lib/links/repository";

export default async function CoachAthleteMaxesPage({
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
    <PageShell back={{ href: `/coach/athletes/${athleteId}`, ariaLabel: "Back to athlete" }}>
      <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
        <MaxesEditor
          listUrl={`/api/coach/athletes/${athleteId}/maxes`}
          saveUrl={`/api/coach/athletes/${athleteId}/maxes`}
          title={`${relationship.athleteName} maxes`}
          description="Enter tested or current maxes for this athlete."
          enableExerciseSearch
        />
      </main>
    </PageShell>
  );
}
