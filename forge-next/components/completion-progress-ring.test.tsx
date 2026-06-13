import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompletionProgressRing } from "@/components/completion-progress-ring";

describe("CompletionProgressRing", () => {
  it("renders the clamped percent in the center", () => {
    render(<CompletionProgressRing percent={32.6} />);

    expect(screen.getByText("33%")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "33% complete" })).toBeInTheDocument();
  });

  it("clamps values below 0 and above 100", () => {
    const { rerender } = render(<CompletionProgressRing percent={-5} />);
    expect(screen.getByText("0%")).toBeInTheDocument();

    rerender(<CompletionProgressRing percent={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("draws a progress arc with stroke-dashoffset", () => {
    const { container } = render(<CompletionProgressRing percent={50} />);

    const progressCircle = container.querySelector(
      "circle.stroke-emerald-500",
    ) as SVGCircleElement | null;

    expect(progressCircle).not.toBeNull();
    expect(progressCircle?.getAttribute("stroke-dashoffset")).not.toBe("0");
    expect(progressCircle?.getAttribute("transform")).toContain("rotate(-90");
  });
});
