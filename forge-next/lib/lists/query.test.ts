import { describe, expect, it } from "vitest";
import {
  buildListUrl,
  getListOffset,
  normalizeListQuery,
  toPaginatedResult,
} from "@/lib/lists/query";
import { DEFAULT_LIST_LIMIT } from "@/lib/lists/types";

describe("normalizeListQuery", () => {
  it("applies defaults", () => {
    expect(normalizeListQuery({})).toEqual({
      q: undefined,
      page: 1,
      limit: DEFAULT_LIST_LIMIT,
    });
  });

  it("trims search and clamps page and limit", () => {
    expect(
      normalizeListQuery({
        q: "  alex  ",
        page: "0",
        limit: "999",
      }),
    ).toEqual({
      q: "alex",
      page: 1,
      limit: 100,
    });
  });
});

describe("getListOffset", () => {
  it("computes zero-based offset from page and limit", () => {
    expect(getListOffset({ q: undefined, page: 3, limit: 10 })).toBe(20);
  });
});

describe("toPaginatedResult", () => {
  it("sets hasMore when more pages exist", () => {
    expect(
      toPaginatedResult(["a"], 25, { q: undefined, page: 1, limit: 10 }),
    ).toEqual({
      items: ["a"],
      total: 25,
      page: 1,
      limit: 10,
      hasMore: true,
    });
  });

  it("clears hasMore on the last page", () => {
    expect(
      toPaginatedResult(["a"], 11, { q: undefined, page: 2, limit: 10 }),
    ).toMatchObject({
      hasMore: false,
    });
  });
});

describe("buildListUrl", () => {
  it("omits default page from the url", () => {
    expect(buildListUrl("/coach/athletes", { q: "alex", page: 1 })).toBe(
      "/coach/athletes?q=alex",
    );
  });

  it("includes page when greater than one", () => {
    expect(buildListUrl("/coach/plans", { q: "strength", page: 2 })).toBe(
      "/coach/plans?q=strength&page=2",
    );
  });
});
