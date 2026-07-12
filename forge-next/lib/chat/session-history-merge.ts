import type { SessionListItemData } from "@/components/coach/session-list-item";

function compareSessionsByUpdatedAt(
  left: SessionListItemData,
  right: SessionListItemData,
): number {
  return (
    new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

export function mergeSessionLists(
  fetched: SessionListItemData[],
  inserted: readonly SessionListItemData[],
): SessionListItemData[] {
  if (inserted.length === 0) {
    return fetched;
  }

  const insertedIds = new Set(inserted.map((session) => session.id));
  const merged = [
    ...inserted,
    ...fetched.filter((session) => !insertedIds.has(session.id)),
  ];

  return [...merged].sort(compareSessionsByUpdatedAt);
}
