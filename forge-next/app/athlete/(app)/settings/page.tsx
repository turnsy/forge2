import { AthleteCoachSettings } from "@/components/athlete-coach-settings";
import { AthleteProfileSettings } from "@/components/athlete-profile-settings";
import { PageHeader, PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { getAthleteCoachLink } from "@/lib/links/repository";

export default async function AthleteSettingsPage() {
  const user = await requireRole("athlete");
  const link = await getAthleteCoachLink();

  return (
    <PageShell
      back={{ href: "/athlete", ariaLabel: "Back to home" }}
      showMobileBack={false}
      header={
        <div className="hidden md:block">
          <PageHeader title="Settings" />
        </div>
      }
    >
      <div className="space-y-4">
        <AthleteProfileSettings fullName={user.fullName} email={user.email} />
        {link?.status === "active" ? (
          <AthleteCoachSettings link={link} />
        ) : (
          <p className="text-sm text-surface-muted">
            Link to a coach from the home page to manage your coach connection here.
          </p>
        )}
      </div>
    </PageShell>
  );
}
