import { PendingInviteList } from "@/components/pending-invite-list";
import { PageHeader, PageShell } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { listCoachPendingInvites } from "@/lib/links/repository";

export default async function CoachPendingInvitesPage() {
  await requireRole("coach");
  const invites = await listCoachPendingInvites();

  return (
    <PageShell
      back={{ href: "/coach/athletes", ariaLabel: "Back to athletes" }}
      header={<PageHeader title="Pending invites" />}
    >
      <PendingInviteList invites={invites} />
    </PageShell>
  );
}
