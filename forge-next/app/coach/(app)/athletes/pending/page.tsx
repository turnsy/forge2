import { PendingInviteList } from "@/components/pending-invite-list";
import { PageContent, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { listCoachPendingInvites } from "@/lib/links/repository";

export default async function CoachPendingInvitesPage() {
  await requireRole("coach");
  const invites = await listCoachPendingInvites();

  return (
    <PageContent>
      <PageHeader
        title="Pending invites"
        back={{ href: "/coach/athletes", ariaLabel: "Back to athletes" }}
      />
      <PendingInviteList invites={invites} />
    </PageContent>
  );
}
