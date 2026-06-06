import {
  DEFAULT_LIST_LIMIT,
  MAX_LIST_LIMIT,
  type ListQuery,
  type PaginatedResult,
} from "@/lib/lists/types";

function clampInt(
  value: string | null | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === null || value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

export function normalizeListQuery(
  params: {
    q?: string | null;
    page?: string | null;
    limit?: string | null;
  },
  defaults?: { limit?: number },
): ListQuery {
  const limit = clampInt(
    params.limit,
    defaults?.limit ?? DEFAULT_LIST_LIMIT,
    1,
    MAX_LIST_LIMIT,
  );
  const page = clampInt(params.page, 1, 1, Number.MAX_SAFE_INTEGER);
  const q = params.q?.trim() || undefined;

  return { q, page, limit };
}

export function getListOffset(query: ListQuery): number {
  return (query.page - 1) * query.limit;
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  query: ListQuery,
): PaginatedResult<T> {
  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    hasMore: query.page * query.limit < total,
  };
}

export function buildListUrl(
  path: string,
  query: { q?: string; page?: number },
): string {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
