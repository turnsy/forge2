/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("@/lib/hooks/use-measured-height", () => ({
  useMeasuredHeight: () => ({
    ref: { current: null },
    height: 72,
  }),
}));

describe("PageContent", () => {
  it("places list search in subHeader below the page header", () => {
    render(
      <PageContent
        listLayout
        header={<PageHeader title="Athletes" />}
        subHeader={<div data-testid="list-search">Search</div>}
      >
        <p>List body</p>
      </PageContent>,
    );

    const search = screen.getByTestId("list-search");
    const header = screen.getByRole("heading", { name: "Athletes" });
    const topChrome = header.closest(".flex.flex-col.gap-6");

    expect(topChrome?.contains(search)).toBe(true);
    expect(header.parentElement?.contains(search)).toBe(false);
  });
});
