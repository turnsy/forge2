/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageBackProvider } from "@/components/ui/page-back-context";
import { PageHeader } from "@/components/ui/page-header";
import { ScrollPage } from "@/components/ui/scroll-page";
import { Tab, TabList, Tabs } from "@/components/ui/tabs";

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

  it("renders subHeader outside the back-link row so tabs align with content", () => {
    render(
      <PageBackProvider
        back={{ href: "/coach/athletes", ariaLabel: "Back to athletes" }}
      >
        <ScrollPage
          header={<PageHeader title="Alex Rivera" />}
          subHeader={
            <Tabs defaultTab="info">
              <TabList>
                <Tab id="info">Profile</Tab>
              </TabList>
            </Tabs>
          }
        >
          <p>Profile details</p>
        </ScrollPage>
      </PageBackProvider>,
    );

    const tablist = screen.getByRole("tablist");
    const backLink = screen.getByRole("link", { name: "Back to athletes" });
    const headerRow = backLink.parentElement;
    const subHeaderRow = tablist.parentElement;

    expect(headerRow).not.toBe(subHeaderRow);
    expect(headerRow?.contains(tablist)).toBe(false);
  });
});
