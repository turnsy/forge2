import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CompletionProgressRing } from "@/components/completion-progress-ring";

describe("CompletionProgressRing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

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

  it("draws a progress arc with stroke-dashoffset", async () => {
    const { container } = render(<CompletionProgressRing percent={50} />);

    await act(async () => {
      await new Promise((resolve) => {
        requestAnimationFrame(() => resolve(undefined));
      });
    });

    const progressCircle = container.querySelector(
      "circle.stroke-emerald-500",
    ) as SVGCircleElement | null;

    expect(progressCircle).not.toBeNull();
    expect(progressCircle?.getAttribute("stroke-dashoffset")).not.toBe("0");
    expect(progressCircle?.getAttribute("transform")).toContain("rotate(-90");
    expect(progressCircle?.getAttribute("class")).toContain("ease-out");
  });

  it("animates to the target percent after mount", async () => {
    const { container } = render(<CompletionProgressRing percent={75} size={36} />);

    const progressCircle = () =>
      container.querySelector("circle.stroke-emerald-500") as SVGCircleElement;

    const fullOffset = String(2 * Math.PI * ((36 - 2.5) / 2));
    expect(progressCircle().getAttribute("stroke-dashoffset")).toBe(fullOffset);

    await act(async () => {
      await new Promise((resolve) => {
        requestAnimationFrame(() => resolve(undefined));
      });
    });

    expect(progressCircle().getAttribute("stroke-dashoffset")).not.toBe(fullOffset);
  });

  it("skips animation when reduced motion is preferred", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<CompletionProgressRing percent={60} size={36} />);
    const radius = (36 - 2.5) / 2;
    const circumference = 2 * Math.PI * radius;
    const expectedOffset = String(circumference - (60 / 100) * circumference);

    expect(
      container
        .querySelector("circle.stroke-emerald-500")
        ?.getAttribute("stroke-dashoffset"),
    ).toBe(expectedOffset);
  });
});
