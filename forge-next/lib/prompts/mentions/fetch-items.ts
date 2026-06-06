import type { CoachAthleteListItem } from "@/lib/athletes/types";
import type { PaginatedResult } from "@/lib/lists/types";
import { MENTION_LIST_LIMIT } from "@/lib/lists/types";
import type { CoachPlanListItem } from "@/lib/plans/types";
import {
  mapAthleteToMentionItem,
  mapPlanToMentionItem,
} from "@/lib/prompts/mentions/options";
import {
  mergeFetchedMentionGroups,
  type MentionSearchGroups,
} from "@/lib/prompts/mentions/search";

function buildMentionListUrl(path: string, query: string): string {
  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("limit", String(MENTION_LIST_LIMIT));

  if (query.trim()) {
    params.set("q", query.trim());
  }

  return `${path}?${params.toString()}`;
}

export async function fetchMentionItemGroups(query: string): Promise<MentionSearchGroups> {
  const [athletesResponse, plansResponse] = await Promise.all([
    fetch(buildMentionListUrl("/api/coach/athletes", query)),
    fetch(buildMentionListUrl("/api/coach/plans", query)),
  ]);

  if (!athletesResponse.ok || !plansResponse.ok) {
    throw new Error("Failed to load mention suggestions");
  }

  const athletes = (await athletesResponse.json()) as PaginatedResult<CoachAthleteListItem>;
  const plans = (await plansResponse.json()) as PaginatedResult<CoachPlanListItem>;

  return mergeFetchedMentionGroups(
    athletes.items.map(mapAthleteToMentionItem),
    plans.items.map(mapPlanToMentionItem),
    MENTION_LIST_LIMIT,
  );
}
