"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_LIST_LIMIT, type PaginatedResult } from "@/lib/lists/types";

const SEARCH_DEBOUNCE_MS = 300;

type UseInfiniteListOptions<T> = {
  fetchPage: (query: {
    q?: string;
    page: number;
    limit: number;
  }) => Promise<PaginatedResult<T>>;
  limit?: number;
};

export function useInfiniteList<T>({
  fetchPage,
  limit = DEFAULT_LIST_LIMIT,
}: UseInfiniteListOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const debouncedSearchRef = useRef(debouncedSearch);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = search.trim();

      if (debouncedSearchRef.current === nextSearch) {
        return;
      }

      debouncedSearchRef.current = nextSearch;
      setDebouncedSearch(nextSearch);
      setItems([]);
      setPage(1);
      setHasMore(false);
      setError(null);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  const loadPage = useCallback(
    async (targetPage: number, requestId: number) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchPage({
          q: debouncedSearch || undefined,
          page: targetPage,
          limit,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setItems((current) =>
          targetPage === 1 ? result.items : [...current, ...result.items],
        );
        setHasMore(result.hasMore);
      } catch (fetchError: unknown) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Could not load items.",
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [debouncedSearch, fetchPage, limit],
  );

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    void loadPage(page, requestId);
  }, [loadPage, page]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) {
      return;
    }

    setPage((current) => current + 1);
  }, [hasMore, loading]);

  return {
    items,
    search,
    setSearch,
    loading,
    error,
    hasMore,
    loadMore,
    isInitialLoading: loading && page === 1,
    isLoadingMore: loading && page > 1,
  };
}
