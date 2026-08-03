import { CoachAthleteMaxesTab } from "@/components/coach-athlete-maxes-tab";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";

export default async function AthleteMaxesPage() {
  await requireRole("athlete");
  return (
    <PageShell>
      <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
        <CoachAthleteMaxesTab
          listUrl="/api/athlete/maxes"
          saveUrl="/api/athlete/maxes"
          searchUrl="/api/athlete/exercises/search"
          confirmUrl="/api/athlete/exercises/confirm"
        />
      </main>
    </PageShell>
  );
}
