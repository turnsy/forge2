import { CoachHomePrompt } from "@/components/coach-home-prompt";
import { PageContent } from "@/components/ui";
import { firstName } from "@/lib/auth/first-name";
import { requireRole } from "@/lib/auth/session";

export default async function CoachHomePage() {
  const user = await requireRole("coach");

  return (
    <PageContent className="flex flex-1 items-center justify-center">
      <CoachHomePrompt firstName={firstName(user.fullName)} role="coach" />
    </PageContent>
  );
}
