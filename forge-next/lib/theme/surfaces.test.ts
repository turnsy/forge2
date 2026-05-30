import { describe, expect, it } from "vitest";
import { buttonVariantClass, cardClass } from "@/lib/theme/surfaces";

describe("surface theme helpers", () => {
  it("includes w-full when fullWidth is true", () => {
    expect(buttonVariantClass("primary", true)).toContain("w-full");
    expect(buttonVariantClass("ghost", true)).toContain("w-full");
  });

  it("omits w-full when fullWidth is false", () => {
    expect(buttonVariantClass("primary", false)).not.toContain("w-full");
    expect(buttonVariantClass("ghost", false)).not.toContain("w-full");
  });

  it("applies role-specific card borders", () => {
    expect(cardClass("coach")).toContain("border-coach-border");
    expect(cardClass("athlete")).toContain("border-athlete-border");
    expect(cardClass()).toContain("border-surface-divider");
  });
});
