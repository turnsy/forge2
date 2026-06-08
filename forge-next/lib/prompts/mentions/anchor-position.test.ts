import { describe, expect, it } from "vitest";
import {
  buildMentionMenuAnchor,
  buildMirrorTextBeforeAnchor,
  mentionMenuAnchorStyle,
  shouldFlipMenuAbove,
} from "@/lib/prompts/mentions/anchor-position";

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

describe("buildMentionMenuAnchor", () => {
  const point = { top: 600, bottom: 620, left: 120 };

  it("opens below the caret when there is room", () => {
    expect(
      buildMentionMenuAnchor(point, {
        maxMenuHeight: 180,
        offset: 4,
        viewportHeight: 900,
      }),
    ).toEqual({
      top: 624,
      left: 120,
      placement: "below",
    });
  });

  it("opens above with bottom-edge anchoring when flipped", () => {
    const anchor = buildMentionMenuAnchor(point, {
      maxMenuHeight: 180,
      offset: 4,
      viewportHeight: 800,
    });

    expect(anchor).toEqual({
      top: 596,
      left: 120,
      placement: "above",
    });
    expect(mentionMenuAnchorStyle(anchor)).toEqual({
      top: 596,
      left: 120,
      transform: "translateY(-100%)",
    });
  });
});
