import { describe, expect, it } from "vitest";
import {
  mapAthleteToMentionItem,
  mapPlanToMentionItem,
} from "@/lib/prompts/mentions/options";

describe("mention item mappers", () => {
  it("maps list athletes and plans to mention items", () => {
    expect(mapAthleteToMentionItem({ id: "a1", name: "Jane Smith" })).toEqual({
      kind: "athlete",
      id: "a1",
      label: "Jane Smith",
    });
    expect(mapPlanToMentionItem({ id: "p1", title: "Summer Block" })).toEqual({
      kind: "plan",
      id: "p1",
      label: "Summer Block",
    });
  });
});
