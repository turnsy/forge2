import { describe, expect, it } from "vitest";
import type { PromptMentionItem } from "@/lib/prompts/mention-types";
import {
  flattenMentionSearchGroups,
  searchMentionItemGroups,
  searchMentionItems,
} from "@/lib/prompts/mention-search";

const items: PromptMentionItem[] = [
  { kind: "athlete", id: "a1", label: "Jane Smith" },
  { kind: "athlete", id: "a2", label: "John Adams" },
  { kind: "plan", id: "p1", label: "Summer Block" },
  { kind: "plan", id: "p2", label: "Winter Base" },
  { kind: "athlete", id: "a3", label: "Jamie Lee" },
];

describe("searchMentionItemGroups", () => {
  it("returns at most four results across groups", () => {
    const groups = searchMentionItemGroups(items, "", 4);

    expect(flattenMentionSearchGroups(groups)).toHaveLength(4);
  });

  it("lists athletes before plans when match scores tie", () => {
    const groups = searchMentionItemGroups(
      [
        { kind: "plan", id: "p1", label: "2-Week Deload" },
        { kind: "athlete", id: "a1", label: "Jay" },
      ],
      "",
      4,
    );

    expect(groups.athletes.map((item) => item.label)).toEqual(["Jay"]);
    expect(groups.plans.map((item) => item.label)).toEqual(["2-Week Deload"]);
  });

  it("fills remaining slots with plans after athletes", () => {
    const groups = searchMentionItemGroups(items, "", 4);

    expect(groups.athletes.length).toBeGreaterThan(0);
    expect(groups.athletes.length + groups.plans.length).toBeLessThanOrEqual(4);
  });

  it("prefers prefix matches within each group", () => {
    expect(searchMentionItems(items, "ja", 4).map((item) => item.label)).toEqual([
      "Jamie Lee",
      "Jane Smith",
    ]);
  });
});
