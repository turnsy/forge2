import type { PaginatedResult } from "@/lib/lists/types";

export async function fetchPaginatedJson<T>(
  path: string,
  query: { q?: string; page: number; limit: number },
): Promise<PaginatedResult<T>> {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  params.set("page", String(query.page));
  params.set("limit", String(query.limit));

  const response = await fetch(`${path}?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Could not load items.");
  }

  return (await response.json()) as PaginatedResult<T>;
}
