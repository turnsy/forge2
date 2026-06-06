import { describe, expect, it } from "vitest";
import { uploadFileSlug } from "@/lib/uploads/file-utils";

describe("uploadFileSlug", () => {
  it("slugifies a csv filename", () => {
    expect(uploadFileSlug("My Plan.csv")).toBe("my-plan");
  });

  it("includes sheet slug for xlsx", () => {
    expect(uploadFileSlug("General Strength.xlsx", "Weekly Volume")).toBe(
      "general-strength__weekly-volume",
    );
  });
});
