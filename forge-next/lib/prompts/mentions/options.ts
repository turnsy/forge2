import type { CoachAthleteListItem } from "@/lib/athletes/types";
import type { CoachPlanListItem } from "@/lib/plans/types";
import type { PromptMentionItem } from "@/lib/prompts/mentions/types";

export function mapAthleteToMentionItem(
  athlete: Pick<CoachAthleteListItem, "id" | "name">,
): PromptMentionItem {
  return {
    kind: "athlete",
    id: athlete.id,
    label: athlete.name,
  };
}

export function mapPlanToMentionItem(
  plan: Pick<CoachPlanListItem, "id" | "title">,
): PromptMentionItem {
  return {
    kind: "plan",
    id: plan.id,
    label: plan.title,
  };
}
