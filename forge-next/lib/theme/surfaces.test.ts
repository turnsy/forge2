import { describe, expect, it } from "vitest";
import {
  attachmentChipClass,
  buttonVariantClass,
  completionCheckmarkClass,
  glassSurfaceClass,
  glassSurfaceTransitionClass,
  iconButtonVariantClass,
  pageBackLinkClass,
  pageBackGutterReserveClass,
  pageContentClass,
  pillClass,
  pillButtonClass,
  cardClass,
  cardFooterClass,
  controlClass,
  selectClass,
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

  it("returns borderless back link styling", () => {
    expect(pageBackLinkClass()).toContain("outline-none");
    expect(pageBackLinkClass()).not.toContain("border");
  });

  it("returns borderless plain icon button styling", () => {
    expect(iconButtonVariantClass("plain", "sm")).toContain("outline-none");
    expect(iconButtonVariantClass("plain", "sm")).not.toContain(
      "glass-button-ghost",
    );
  });

  it("reserves left padding for the overlay back control", () => {
    expect(pageBackGutterReserveClass()).toBe("pl-12");
  });

  it("returns shared control styling", () => {
    expect(controlClass()).toContain("glass-surface");
    expect(controlClass()).toContain("rounded-control");
    expect(controlClass()).toContain("w-full");
  });

  it("returns select styling with extra trailing padding for the chevron", () => {
    expect(selectClass("sm")).toContain("pr-10");
    expect(selectClass("md")).toContain("pr-12");
    expect(selectClass()).toContain("cursor-pointer");
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

  it("returns pill styling", () => {
    expect(pillClass()).toContain("rounded-full");
    expect(pillClass("danger")).toContain("bg-red-600");
  });

  it("returns pill button styling for selected and unselected states", () => {
    expect(pillButtonClass(false)).toContain("bg-glass");
    expect(pillButtonClass(true)).toContain("glass-button-primary");
  });

  it("uses tighter page padding on small screens", () => {
    expect(pageContentClass()).toContain("p-4");
    expect(pageContentClass()).toContain("md:p-8");
  });

  it("returns default and success glass surface styling", () => {
    expect(glassSurfaceClass()).toContain("bg-glass");
    expect(glassSurfaceClass()).toContain("border-glass-border");
    expect(glassSurfaceClass("nested")).toContain("bg-[var(--color-glass-nested)]");
    expect(glassSurfaceClass("default", "success")).toContain("bg-success-muted");
    expect(glassSurfaceClass("default", "success")).toContain("border-success-border");
    expect(glassSurfaceClass()).toContain(glassSurfaceTransitionClass);
  });

  it("returns completion checkmark styling", () => {
    expect(completionCheckmarkClass(false)).toContain("border-glass-border");
    expect(completionCheckmarkClass(true)).toContain("bg-success-muted");
    expect(completionCheckmarkClass(true)).toContain("text-success");
  });
});
