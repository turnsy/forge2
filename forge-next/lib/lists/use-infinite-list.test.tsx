import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PaginatedResult } from "@/lib/lists/types";
import { useInfiniteList } from "@/lib/lists/use-infinite-list";

type TestItem = { id: string; label: string };

function createPage(
  page: number,
  items: TestItem[],
  hasMore: boolean,
): PaginatedResult<TestItem> {
  return {
    items,
    total: items.length,
    page,
    limit: 10,
    hasMore,
  };
}

describe("useInfiniteList", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads the first page on mount", async () => {
    const fetchPage = vi.fn(async () =>
      createPage(1, [{ id: "1", label: "One" }], false),
    );

    const { result } = renderHook(() =>
      useInfiniteList<TestItem>({
        apiPath: "/api/test",
        fetchPage,
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(fetchPage).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      q: undefined,
    });
    expect(result.current.items).toEqual([{ id: "1", label: "One" }]);
    expect(result.current.hasMore).toBe(false);
  });

  it("appends additional pages when loadMore is called", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(createPage(1, [{ id: "1", label: "One" }], true))
      .mockResolvedValueOnce(createPage(2, [{ id: "2", label: "Two" }], false));

    const { result } = renderHook(() =>
      useInfiniteList<TestItem>({
        apiPath: "/api/test",
        fetchPage,
      }),
    );

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
    });

    expect(result.current.items).toEqual([
      { id: "1", label: "One" },
      { id: "2", label: "Two" },
    ]);
    expect(result.current.isLoadingMore).toBe(false);
  });

  it("debounces search and reloads from page one", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(createPage(1, [{ id: "1", label: "Alpha" }], false))
      .mockResolvedValueOnce(createPage(1, [{ id: "2", label: "Beta" }], false));

    const { result } = renderHook(() =>
      useInfiniteList<TestItem>({
        apiPath: "/api/test",
        fetchPage,
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSearch("beta");
    });

    expect(result.current.isSearchPending).toBe(true);
    expect(result.current.isListLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.items).toEqual([{ id: "2", label: "Beta" }]);
    });

    expect(fetchPage).toHaveBeenLastCalledWith({
      page: 1,
      limit: 10,
      q: "beta",
    });
    expect(result.current.isSearchPending).toBe(false);
  });

  it("surfaces fetch errors", async () => {
    const fetchPage = vi.fn(async () => {
      throw new Error("Could not load items.");
    });

    const { result } = renderHook(() =>
      useInfiniteList<TestItem>({
        apiPath: "/api/test",
        fetchPage,
      }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe("Could not load items.");
    });

    expect(result.current.items).toEqual([]);
  });
});
