import { describe, expect, it } from "vitest";
import {
  attachmentChipClass,
  buttonVariantClass,
  cardClass,
  cardFooterClass,
  controlClass,
  dividerLineClass,
  messageToneClass,
} from "@/lib/theme/surfaces";

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

  it("returns shared control styling", () => {
    expect(controlClass()).toContain("glass-surface");
    expect(controlClass()).toContain("rounded-control");
    expect(controlClass()).toContain("w-full");
  });

  it("returns tone-specific message styling", () => {
    expect(messageToneClass("error")).toContain("text-danger");
    expect(messageToneClass("success")).toContain("text-success");
    expect(messageToneClass("info")).toContain("text-surface-muted");
  });

  it("returns card footer styling", () => {
    expect(cardFooterClass()).toContain("border-t");
    expect(cardFooterClass()).toContain("border-surface-divider");
  });

  it("returns divider line styling", () => {
    expect(dividerLineClass()).toContain("border-t");
    expect(dividerLineClass()).toContain("border-surface-divider");
  });

  it("returns attachment chip styling", () => {
    expect(attachmentChipClass()).toContain("rounded-full");
    expect(attachmentChipClass("error")).toContain("text-red-200");
  });
});
