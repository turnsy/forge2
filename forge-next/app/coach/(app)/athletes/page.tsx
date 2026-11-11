import { MetadataRoster } from "@/components/metadata/metadata-roster";
import { AthletesPageHeader } from "@/components/athletes-page-header";
import { PageContent } from "@/components/ui";
import { getProfile, requireRole } from "@/lib/auth/session";
import { countCoachPendingInvites } from "@/lib/links/repository";

export default async function CoachAthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireRole("coach");
  const profile = await getProfile(user.id);
  const inviteCode = profile?.invite_code?.trim() ?? "";
  const pendingCount = await countCoachPendingInvites();
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  return (
    <PageContent
      listLayout
      header={
        <AthletesPageHeader
          inviteCode={inviteCode}
          pendingCount={pendingCount}
        />
      }
    >
      <MetadataRoster initialQuery={params.q ?? ""} initialPage={page} />
    </PageContent>
  );
}
