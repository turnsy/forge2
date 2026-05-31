import { describe, expect, it } from "vitest";
import { firstName } from "@/lib/auth/first-name";

describe("firstName", () => {
  it("returns the first word of a full name", () => {
    expect(firstName("Jay Turnsek")).toBe("Jay");
  });

  it("falls back when the name is missing", () => {
    expect(firstName(null)).toBe("there");
    expect(firstName("")).toBe("there");
    expect(firstName("   ")).toBe("there");
  });
});
