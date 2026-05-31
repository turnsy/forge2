import type { CoachAthleteSummary } from "@/lib/athletes/types";
import type { CoachPlanSummary } from "@/lib/plans/types";
import type { PromptMentionItem } from "@/lib/prompts/mention-types";

export function toPromptMentionItems(
  athletes: CoachAthleteSummary[],
  plans: CoachPlanSummary[],
): PromptMentionItem[] {
  return [
    ...athletes.map(
      (athlete): PromptMentionItem => ({
        kind: "athlete",
        id: athlete.id,
        label: athlete.name,
      }),
    ),
    ...plans.map(
      (plan): PromptMentionItem => ({
        kind: "plan",
        id: plan.id,
        label: plan.title,
      }),
    ),
  ];
}
