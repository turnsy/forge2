import { describe, expect, it } from "vitest";
import { isNavItemActive } from "./active-path";

describe("isNavItemActive", () => {
  it("activates home only on exact match when exact is true", () => {
    expect(isNavItemActive("/coach", "/coach", true)).toBe(true);
    expect(isNavItemActive("/coach/plans", "/coach", true)).toBe(false);
    expect(isNavItemActive("/athlete", "/athlete", true)).toBe(true);
    expect(isNavItemActive("/athlete/settings", "/athlete", true)).toBe(false);
  });

  it("activates nested routes for non-exact hrefs", () => {
    expect(isNavItemActive("/coach/plans", "/coach/plans")).toBe(true);
    expect(isNavItemActive("/coach/plans/weekly", "/coach/plans")).toBe(true);
    expect(isNavItemActive("/coach/athletes", "/coach/plans")).toBe(false);
  });

  it("activates exact matches for leaf routes", () => {
    expect(isNavItemActive("/coach/settings", "/coach/settings")).toBe(true);
    expect(isNavItemActive("/coach/athletes", "/coach/athletes")).toBe(true);
  });
});
