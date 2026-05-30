import { describe, expect, it } from "vitest";
import {
  roleBorderClass,
  roleLabel,
  roleLinkClass,
} from "@/lib/theme/roles";

describe("role theme helpers", () => {
  it("returns display labels for each role", () => {
    expect(roleLabel("coach")).toBe("Coach");
    expect(roleLabel("athlete")).toBe("Athlete");
  });

  it("returns coach-specific link classes", () => {
    const classes = roleLinkClass("coach");

    expect(classes.length).toBeGreaterThan(0);
    expect(classes).toContain("text-coach");
    expect(classes).toContain("decoration-coach-muted");
  });

  it("returns athlete-specific link classes", () => {
    const classes = roleLinkClass("athlete");

    expect(classes.length).toBeGreaterThan(0);
    expect(classes).toContain("text-athlete");
    expect(classes).toContain("decoration-athlete-muted");
  });

  it("returns role-specific border classes", () => {
    expect(roleBorderClass("coach")).toBe("border-coach-border");
    expect(roleBorderClass("athlete")).toBe("border-athlete-border");
  });
});
