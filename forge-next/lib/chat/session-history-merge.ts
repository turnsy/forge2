import type { SessionListItemData } from "@/components/coach/session-list-item";

export function mergeSessionLists(
  fetched: SessionListItemData[],
  inserted: readonly SessionListItemData[],
): SessionListItemData[] {
  if (inserted.length === 0) {
    return fetched;
  }

  const insertedIds = new Set(inserted.map((session) => session.id));
  return [
    ...inserted,
    ...fetched.filter((session) => !insertedIds.has(session.id)),
  ];
}
