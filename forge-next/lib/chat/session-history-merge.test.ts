import { describe, expect, it } from "vitest";
import { mergeSessionLists } from "@/lib/chat/session-history-merge";

describe("mergeSessionLists", () => {
  it("returns fetched sessions when there are no inserted sessions", () => {
    const fetched = [
      { id: "a", title: "A", updatedAt: "2026-01-01T00:00:00.000Z" },
    ];

    expect(mergeSessionLists(fetched, [])).toEqual(fetched);
  });

  it("prepends inserted sessions and dedupes fetched entries", () => {
    const fetched = [
      { id: "a", title: "A", updatedAt: "2026-01-01T00:00:00.000Z" },
      { id: "b", title: "B", updatedAt: "2026-01-02T00:00:00.000Z" },
    ];
    const inserted = [
      { id: "c", title: "C", updatedAt: "2026-01-03T00:00:00.000Z" },
      { id: "a", title: "A newer", updatedAt: "2026-01-04T00:00:00.000Z" },
    ];

    expect(mergeSessionLists(fetched, inserted)).toEqual([
      { id: "c", title: "C", updatedAt: "2026-01-03T00:00:00.000Z" },
      { id: "a", title: "A newer", updatedAt: "2026-01-04T00:00:00.000Z" },
      { id: "b", title: "B", updatedAt: "2026-01-02T00:00:00.000Z" },
    ]);
  });
});
