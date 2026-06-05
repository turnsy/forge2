import { CoachPlanWorkspace } from "@/components/coach/coach-plan-workspace";
import { PageContent } from "@/components/ui";
import { listCoachAthleteSummaries } from "@/lib/athletes/repository";
import { firstName } from "@/lib/auth/first-name";
import { requireRole } from "@/lib/auth/session";
import { toPromptMentionItems } from "@/lib/prompts/mention-options";
import { listCoachPlanSummaries } from "@/lib/plans/repository";

export default async function CoachHomePage() {
  const user = await requireRole("coach");
  const [athletes, plans] = await Promise.all([
    listCoachAthleteSummaries(),
    listCoachPlanSummaries(user.id),
  ]);

  return (
    <PageContent className="flex min-h-0 flex-1 flex-col overflow-hidden max-w-none px-0 py-0">
      <CoachPlanWorkspace
        firstName={firstName(user.fullName)}
        role="coach"
        mentionItems={toPromptMentionItems(athletes, plans)}
      />
    </PageContent>
  );
}
