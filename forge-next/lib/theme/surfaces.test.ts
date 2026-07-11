import { describe, expect, it } from "vitest";
import {
  BUTTON_MD_HEIGHT_CLASS,
  BUTTON_SM_HEIGHT_CLASS,
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

  it("uses matching heights for text and icon buttons at each size", () => {
    expect(buttonVariantClass("ghost", false, "sm")).toContain(
      BUTTON_SM_HEIGHT_CLASS,
    );
    expect(iconButtonVariantClass("ghost", "sm")).toContain(
      `${BUTTON_SM_HEIGHT_CLASS} w-8`,
    );
    expect(buttonVariantClass("primary", false, "md")).toContain(
      BUTTON_MD_HEIGHT_CLASS,
    );
    expect(iconButtonVariantClass("primary", "md")).toContain(
      `${BUTTON_MD_HEIGHT_CLASS} w-11`,
    );
  });

  it("uses grayscale glass card styling", () => {
    expect(cardClass()).toContain("border-glass-border");
    expect(cardClass()).toContain("bg-glass");
    expect(cardClass()).toContain("backdrop-blur-md");
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

  it("returns dashed icon button styling for empty-state controls", () => {
    expect(iconButtonVariantClass("dashed", "sm")).toContain("border-dashed");
    expect(iconButtonVariantClass("dashed", "sm")).toContain("text-surface-muted");
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
    expect(selectClass()).toContain("appearance-none");
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
    expect(attachmentChipClass()).toContain(BUTTON_SM_HEIGHT_CLASS);
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
