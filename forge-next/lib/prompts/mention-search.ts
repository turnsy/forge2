import type { PromptMentionItem } from "@/lib/prompts/mention-types";

export type MentionSearchGroups = {
  athletes: PromptMentionItem[];
  plans: PromptMentionItem[];
};

export function flattenMentionSearchGroups(
  groups: MentionSearchGroups,
): PromptMentionItem[] {
  return [...groups.athletes, ...groups.plans];
}

function rankMentionItems(
  items: PromptMentionItem[],
  query: string,
): PromptMentionItem[] {
  return items
    .map((item) => ({
      item,
      score: mentionMatchScore(item.label, query),
    }))
    .filter(
      (entry): entry is { item: PromptMentionItem; score: number } =>
        entry.score !== null,
    )
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.item.label.localeCompare(right.item.label);
    })
    .map((entry) => entry.item);
}

function mentionMatchScore(label: string, query: string): number | null {
  const normalizedLabel = label.toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return 0;
  }

  if (normalizedLabel.startsWith(normalizedQuery)) {
    return 2;
  }

  if (normalizedLabel.includes(normalizedQuery)) {
    return 1;
  }

  return null;
}

export function searchMentionItemGroups(
  items: PromptMentionItem[],
  query: string,
  limit = 4,
): MentionSearchGroups {
  const athletes = rankMentionItems(
    items.filter((item) => item.kind === "athlete"),
    query,
  ).slice(0, limit);
  const remaining = Math.max(0, limit - athletes.length);
  const plans = rankMentionItems(
    items.filter((item) => item.kind === "plan"),
    query,
  ).slice(0, remaining);

  return { athletes, plans };
}

export function searchMentionItems(
  items: PromptMentionItem[],
  query: string,
  limit = 4,
): PromptMentionItem[] {
  return flattenMentionSearchGroups(searchMentionItemGroups(items, query, limit));
}
