import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";

describe("ProgressiveBlur", () => {
  it("renders stacked blur layers with a directional mask and darkening scrim", () => {
    const { container } = render(
      <ProgressiveBlur direction="bottom" className="absolute inset-0" />,
    );

    const layers = container.querySelectorAll(".backdrop-blur-\\[2px\\], .backdrop-blur-\\[64px\\]");
    expect(layers.length).toBeGreaterThan(0);
    expect(container.firstElementChild?.className).toContain("absolute");
    expect(container.querySelector("[style*='linear-gradient']")).not.toBeNull();
    expect(container.innerHTML).toContain("from-surface/75");
  });
});
