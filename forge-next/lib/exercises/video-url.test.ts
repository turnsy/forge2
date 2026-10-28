import { describe, expect, it } from "vitest";
import { exerciseVideoIds, exerciseVideoInput } from "./video-url";

describe("exercise video input", () => {
  it("trims URLs and allows blank input to remove a video", () => {
    expect(
      exerciseVideoInput.parse({ videoUrl: " https://youtu.be/demo " })
        .videoUrl,
    ).toBe("https://youtu.be/demo");
    expect(exerciseVideoInput.parse({ videoUrl: "  " }).videoUrl).toBe("");
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,demo",
    "ftp://example.com",
    "invalid",
    "https://user:password@example.com",
  ])("rejects %s", (url) => {
    expect(exerciseVideoInput.safeParse({ videoUrl: url }).success).toBe(false);
  });
  it("limits and validates batch IDs", () => {
    expect(exerciseVideoIds.safeParse({ ids: ["not-a-uuid"] }).success).toBe(
      false,
    );
    expect(
      exerciseVideoIds.safeParse({
        ids: Array(201).fill("11111111-1111-4111-8111-111111111111"),
      }).success,
    ).toBe(false);
  });
});
