import { describe, expect, it } from "vitest";
import { draftUploadSlug } from "@/lib/uploads/file-utils";

describe("draftUploadSlug", () => {
  it("uses stem only for non-sheet uploads", () => {
    expect(draftUploadSlug("My Plan.csv")).toBe("my-plan");
  });

  it("combines stem and sheet with double underscore", () => {
    expect(draftUploadSlug("General Strength.xlsx", "Weekly Volume")).toBe(
      "general-strength__weekly-volume",
    );
  });
});
