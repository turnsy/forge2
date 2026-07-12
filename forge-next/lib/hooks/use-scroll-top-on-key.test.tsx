/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useScrollTopOnKey } from "@/lib/hooks/use-scroll-top-on-key";

function ScrollFixture({
  resetKey,
  alignWhenReady = true,
}: {
  resetKey: string | number;
  alignWhenReady?: boolean;
}) {
  const ref = useScrollTopOnKey(resetKey, alignWhenReady);

  return (
    <div
      ref={ref}
      data-testid="scroll"
      style={{ height: 120, overflow: "auto" }}
    >
      <div style={{ height: 400 }}>content</div>
    </div>
  );
}

describe("useScrollTopOnKey", () => {
  it("scrolls to the top when the reset key changes", () => {
    const { rerender, getByTestId } = render(<ScrollFixture resetKey="a" />);
    const scroll = getByTestId("scroll") as HTMLDivElement;

    scroll.scrollTop = 200;
    expect(scroll.scrollTop).toBe(200);

    rerender(<ScrollFixture resetKey="b" />);
    expect(scroll.scrollTop).toBe(0);
  });

  it("waits for chrome readiness before scrolling", () => {
    const { rerender, getByTestId } = render(
      <ScrollFixture resetKey="a" alignWhenReady={false} />,
    );
    const scroll = getByTestId("scroll") as HTMLDivElement;

    scroll.scrollTop = 200;
    rerender(<ScrollFixture resetKey="a" alignWhenReady />);
    expect(scroll.scrollTop).toBe(0);
  });
});
