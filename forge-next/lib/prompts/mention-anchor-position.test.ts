import { describe, expect, it } from "vitest";
import {
  buildMirrorTextBeforeAnchor,
  shouldFlipMenuAbove,
} from "@/lib/prompts/mention-anchor-position";

describe("buildMirrorTextBeforeAnchor", () => {
  it("uses the @ index rather than the caret", () => {
    expect(buildMirrorTextBeforeAnchor("Update @jane", 7)).toEqual({
      before: "Update ",
      marker: "@",
    });
  });
});

describe("shouldFlipMenuAbove", () => {
  it("flips when the menu would overflow the viewport", () => {
    expect(shouldFlipMenuAbove(700, 180, 800)).toBe(true);
    expect(shouldFlipMenuAbove(100, 180, 800)).toBe(false);
  });
});
