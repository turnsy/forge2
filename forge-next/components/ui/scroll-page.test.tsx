/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageBackProvider } from "@/components/ui/page-back-context";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollPage } from "@/components/ui/scroll-page";

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("@/lib/hooks/use-measured-height", () => ({
  useMeasuredHeight: () => ({
    ref: { current: null },
    height: 72,
  }),
}));

describe("ScrollPage", () => {
  it("renders page back links from context in top chrome", () => {
    render(
      <PageBackProvider
        back={{ href: "/coach/plans", ariaLabel: "Back to plans" }}
      >
        <ScrollPage header={<PageHeader title="Plan detail" />}>
          <p>Body</p>
        </ScrollPage>
      </PageBackProvider>,
    );

    expect(screen.getByRole("link", { name: "Back to plans" })).toHaveAttribute(
      "href",
      "/coach/plans",
    );
    expect(screen.getByRole("heading", { name: "Plan detail" })).toBeInTheDocument();
  });
});
