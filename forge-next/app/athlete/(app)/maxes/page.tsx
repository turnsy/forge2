import { MaxesEditor } from "@/components/maxes-editor";
import { PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";

export default async function AthleteMaxesPage() {
  await requireRole("athlete");
  return (
    <PageShell>
      <main className="mx-auto w-full max-w-3xl p-4 md:p-8">
        <MaxesEditor
          listUrl="/api/athlete/maxes"
          saveUrl="/api/athlete/maxes"
          title="Exercise maxes"
          description="Record a tested or current training max."
        />
      </main>
    </PageShell>
  );
}
