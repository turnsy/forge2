import { describe, expect, it } from "vitest";
import { profileLabels } from "./profile-labels";

describe("profileLabels", () => {
  it("shows full name and email when both are present", () => {
    expect(profileLabels("Coach User", "coach@example.com")).toEqual({
      displayName: "Coach User",
      displayEmail: "coach@example.com",
    });
  });

  it("falls back to email when full name is missing", () => {
    expect(profileLabels(null, "coach@example.com")).toEqual({
      displayName: "coach@example.com",
      displayEmail: undefined,
    });
  });

  it("falls back to Account when name and email are missing", () => {
    expect(profileLabels(null, undefined)).toEqual({
      displayName: "Account",
      displayEmail: undefined,
    });
  });
});
