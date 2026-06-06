export const DEFAULT_LIST_LIMIT = 10;
export const MENTION_LIST_LIMIT = 4;
export const MAX_LIST_LIMIT = 100;

export type ListQuery = {
  q?: string;
  page: number;
  limit: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};
