/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OverlayScrollChrome } from "@/components/ui/overlay-scroll-chrome";
import { OVERLAY_PRE_FOOTER_CLASS } from "@/lib/layout/overlay-scroll-chrome-layout";
import { overlayScrollLaneStyle } from "@/lib/layout/overlay-scroll-lane";

vi.mock("@/lib/hooks/use-measured-height", () => ({
  useMeasuredHeight: () => ({
    ref: { current: null },
    height: 120,
  }),
}));

describe("OverlayScrollChrome", () => {
  it("renders progressive blur chrome and passes measured padding to content", () => {
    const { container } = render(
      <OverlayScrollChrome
        topChrome={<button type="button">History</button>}
        preFooter={<button type="button">View</button>}
        footer={<button type="button">Prompt</button>}
        footerInsetClassName="pb-nav"
      >
        {(lanePadding) => (
          <div
            data-testid="scroll-layer"
            style={overlayScrollLaneStyle(lanePadding)}
          />
        )}
      </OverlayScrollChrome>,
    );

    expect(container.querySelector("[style*='linear-gradient']")).not.toBeNull();
    expect(container.innerHTML).toContain(OVERLAY_PRE_FOOTER_CLASS);

    const blurZone = container.querySelector(".pb-nav");
    expect(blurZone).not.toBeNull();
    expect(blurZone?.querySelector('button[type="button"]')?.textContent).toBe(
      "View",
    );
    expect(blurZone?.textContent).toContain("Prompt");

    const scrollLayer = container.querySelector('[data-testid="scroll-layer"]');
    expect(scrollLayer).toHaveStyle({ top: "136px", bottom: "136px" });
  });
});
