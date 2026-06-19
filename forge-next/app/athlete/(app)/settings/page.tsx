import { AthleteCoachSettings } from "@/components/athlete-coach-settings";
import { AthleteProfileSettings } from "@/components/athlete-profile-settings";
import { PageHeader, PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { getAthleteCoachLink } from "@/lib/links/repository";
import { MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";

export default async function AthleteSettingsPage() {
  const user = await requireRole("athlete");
  const link = await getAthleteCoachLink();

  return (
    <PageShell
      back={{ href: "/athlete", ariaLabel: "Back to home" }}
      showMobileBack={false}
    >
      <div className="hidden md:block">
        <PageHeader title="Settings" />
      </div>
      <div className={`space-y-4 ${MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS}`}>
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
