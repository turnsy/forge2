/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MobileOverlayScrollChrome } from "@/components/coach/mobile-overlay-scroll-chrome";
import { MOBILE_COMPOSER_TOOLBAR_FOOTER_CLASS } from "@/lib/coach/mobile-workspace-layout";

vi.mock("@/lib/hooks/use-measured-height", () => ({
  useMeasuredHeight: () => ({
    ref: { current: null },
    height: 120,
  }),
}));

describe("MobileOverlayScrollChrome", () => {
  it("renders progressive blur chrome and passes measured padding to content", () => {
    const { container } = render(
      <MobileOverlayScrollChrome
        topChrome={<button type="button">History</button>}
        preFooter={<button type="button">View</button>}
        footer={<button type="button">Prompt</button>}
        footerInsetClassName="pb-nav"
      >
        {({ scrollPaddingTop, scrollPaddingBottom }) => (
          <div
            data-testid="scroll-layer"
            style={{
              paddingTop: scrollPaddingTop,
              paddingBottom: scrollPaddingBottom,
            }}
          />
        )}
      </MobileOverlayScrollChrome>,
    );

    expect(container.querySelector("[style*='linear-gradient']")).not.toBeNull();
    expect(container.innerHTML).toContain(MOBILE_COMPOSER_TOOLBAR_FOOTER_CLASS);
    expect(container.querySelector(".pb-nav")).not.toBeNull();

    const scrollLayer = container.querySelector('[data-testid="scroll-layer"]');
    expect(scrollLayer).toHaveStyle({ paddingTop: "128px", paddingBottom: "128px" });
  });
});
