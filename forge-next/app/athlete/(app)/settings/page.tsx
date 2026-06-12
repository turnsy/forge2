import { AthleteCoachSettings } from "@/components/athlete-coach-settings";
import { PageHeader, PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { getAthleteCoachLink } from "@/lib/links/repository";

export default async function AthleteSettingsPage() {
  await requireRole("athlete");
  const link = await getAthleteCoachLink();

  return (
    <PageShell back={{ href: "/athlete", ariaLabel: "Back to home" }}>
      <PageHeader title="Settings" />
      {link?.status === "active" ? (
        <AthleteCoachSettings link={link} />
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Link to a coach from the home page to manage your coach connection here.
        </p>
      )}
    </PageShell>
  );
}
