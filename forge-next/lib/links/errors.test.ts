import { describe, expect, it } from "vitest";
import { normalizeLinkError } from "@/lib/links/errors";

describe("normalizeLinkError", () => {
  it("maps known database errors to user-facing copy", () => {
    expect(normalizeLinkError("Invalid invite code")).toBe(
      "That invite code is not valid. Check the code and try again.",
    );
    expect(normalizeLinkError("Already linked to a coach")).toBe(
      "You are already linked to a coach.",
    );
  });

  it("returns unknown errors unchanged", () => {
    expect(normalizeLinkError("Custom failure")).toBe("Custom failure");
  });

  it("falls back when message is empty", () => {
    expect(normalizeLinkError("   ")).toBe("Something went wrong. Please try again.");
  });
});
