import { describe, expect, it } from "vitest";
import { roleNavItems, settingsPathForRole } from "./role-nav";

describe("roleNavItems", () => {
  it("defines coach navigation", () => {
    expect(roleNavItems.coach.map((item) => item.label)).toEqual([
      "Home",
      "Plans",
      "Athletes",
    ]);
    expect(roleNavItems.coach[0]?.exact).toBe(true);
  });

  it("defines athlete navigation", () => {
    expect(roleNavItems.athlete.map((item) => item.label)).toEqual(["Home"]);
  });
});

describe("settingsPathForRole", () => {
  it("returns role-scoped settings paths", () => {
    expect(settingsPathForRole("coach")).toBe("/coach/settings");
    expect(settingsPathForRole("athlete")).toBe("/athlete/settings");
  });
});
