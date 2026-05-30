import { describe, expect, it } from "vitest";
import { isNavItemActive } from "./active-path";

describe("isNavItemActive", () => {
  it("activates home only on exact /coach", () => {
    expect(isNavItemActive("/coach", "/coach")).toBe(true);
    expect(isNavItemActive("/coach/plans", "/coach")).toBe(false);
    expect(isNavItemActive("/coach/athletes", "/coach")).toBe(false);
  });

  it("activates nested routes for non-home hrefs", () => {
    expect(isNavItemActive("/coach/plans", "/coach/plans")).toBe(true);
    expect(isNavItemActive("/coach/plans/weekly", "/coach/plans")).toBe(true);
    expect(isNavItemActive("/coach/athletes", "/coach/plans")).toBe(false);
  });

  it("activates exact matches for leaf routes", () => {
    expect(isNavItemActive("/coach/settings", "/coach/settings")).toBe(true);
    expect(isNavItemActive("/coach/athletes", "/coach/athletes")).toBe(true);
  });
});
