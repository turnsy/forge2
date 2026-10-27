import { describe, expect, it } from "vitest";
import { parseCoachAthleteDetailTab } from "@/lib/coach/athlete-detail-tabs";

describe("parseCoachAthleteDetailTab", () => {
  it("returns known tab ids", () => {
    expect(parseCoachAthleteDetailTab("maxes")).toBe("maxes");
    expect(parseCoachAthleteDetailTab("info")).toBe("info");
  });

  it("returns undefined for unknown values", () => {
    expect(parseCoachAthleteDetailTab(undefined)).toBeUndefined();
    expect(parseCoachAthleteDetailTab("settings")).toBeUndefined();
  });
});
