import { CoachWorkspace } from "@/components/coach/coach-workspace";
import { PageContent } from "@/components/ui";
import { firstName } from "@/lib/auth/first-name";
import { requireRole } from "@/lib/auth/session";

export default async function CoachHomePage() {
  const user = await requireRole("coach");

  return (
    <PageContent className="flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-hidden max-w-none px-0 py-0">
      <CoachWorkspace firstName={firstName(user.fullName)} role="coach" />
    </PageContent>
  );
}
