import { describe, expect, it } from "vitest";
import { toPromptMentionItems } from "@/lib/prompts/mention-options";

describe("toPromptMentionItems", () => {
  it("maps athlete and plan summaries to mention items", () => {
    expect(
      toPromptMentionItems(
        [{ id: "a1", name: "Jane Smith" }],
        [{ id: "p1", title: "Summer Block" }],
      ),
    ).toEqual([
      { kind: "athlete", id: "a1", label: "Jane Smith" },
      { kind: "plan", id: "p1", label: "Summer Block" },
    ]);
  });
});
