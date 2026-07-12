import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

describe("ProgressiveBlur", () => {
  it("renders stacked blur and scrim layers with directional masks", () => {
    const { container } = render(
      <ProgressiveBlur direction="bottom" className="absolute inset-0" />,
    );

    const blurLayers = container.querySelectorAll(
      ".backdrop-blur-\\[2px\\], .backdrop-blur-\\[64px\\]",
    );
    const scrimLayers = container.querySelectorAll(".bg-surface\\/40");

    expect(blurLayers.length).toBeGreaterThan(0);
    expect(scrimLayers.length).toBe(1);
    expect(container.firstElementChild?.className).toContain("absolute");
    expect(container.querySelectorAll("[style*='linear-gradient']").length).toBe(
      14,
    );
  });
});
