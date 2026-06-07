import { PendingInviteList } from "@/components/pending-invite-list";
import { BackRefButton, PageContent, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { listCoachPendingInvites } from "@/lib/links/repository";

export default async function CoachPendingInvitesPage() {
  await requireRole("coach");
  const invites = await listCoachPendingInvites();

  return (
    <PageContent>
      <PageHeader
        title="Pending invites"
        actions={
          <BackRefButton href="/coach/athletes">← Back to athletes</BackRefButton>
        }
      />
      <PendingInviteList invites={invites} />
    </PageContent>
  );
}
