import { CoachAthleteMaxesTab } from "@/components/coach-athlete-maxes-tab";
import { PageHeader, PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";

export default async function AthleteMaxesPage() {
  await requireRole("athlete");
  return (
    <PageShell header={<PageHeader title="Maxes" />}>
      <div className="mx-auto w-full max-w-3xl">
        <CoachAthleteMaxesTab
          listUrl="/api/athlete/maxes"
          saveUrl="/api/athlete/maxes"
          searchUrl="/api/athlete/exercises/search"
          confirmUrl="/api/athlete/exercises/confirm"
          allowCreate={false}
        />
      </div>
    </PageShell>
  );
}
