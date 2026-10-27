import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  MobileAppHeader,
  MobileAppHeaderProvider,
  MobileHeaderContent,
} from "./mobile-app-header";
import { MobileSidebarDrawer } from "./mobile-sidebar-drawer";
import { PageHeader } from "./page-header";
import { ScrollPage } from "./scroll-page";
import { PlusIcon } from "@/components/icons/plus-icon";

let pathname = "/coach/plans";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));

describe("shared mobile app header", () => {
  it("preserves page state when switching between mobile and desktop", async () => {
    const user = userEvent.setup();
    function Page() {
      const [count, setCount] = useState(0);
      return <button onClick={() => setCount(count + 1)}>Edits {count}</button>;
    }
    const layout = (enabled: boolean) => (
      <MobileAppHeaderProvider enabled={enabled}>
        <MobileAppHeader />
        <Page />
      </MobileAppHeaderProvider>
    );
    const view = render(layout(true));
    await user.click(screen.getByRole("button", { name: "Edits 0" }));
    view.rerender(layout(false));
    expect(screen.getByRole("button", { name: "Edits 1" })).toBeInTheDocument();
    view.rerender(layout(true));
    expect(screen.getByRole("button", { name: "Edits 1" })).toBeInTheDocument();
  });

  it("puts a page's title and action in the shell while search and tabs stay below", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <MobileAppHeaderProvider>
        <MobileAppHeader />
        <MobileSidebarDrawer>
          <p>Navigation</p>
        </MobileSidebarDrawer>
        <ScrollPage
          back={{ href: "/coach", ariaLabel: "Back to home" }}
          header={
            <PageHeader
              title="Testing Maxes"
              actions={
                <button onClick={action}>
                  <PlusIcon />
                  New
                </button>
              }
            />
          }
          subHeader={<input aria-label="Search plans" />}
        >
          Body
        </ScrollPage>
      </MobileAppHeaderProvider>,
    );
    const header = container.querySelector(
      "[data-mobile-app-header]",
    ) as HTMLElement;
    expect(
      within(header).getByRole("heading", { name: "Testing Maxes" }),
    ).toBeInTheDocument();
    expect(
      within(header).getByRole("button", { name: "Open sidebar" }),
    ).toBeInTheDocument();
    await user.click(within(header).getByRole("button", { name: "New" }));
    expect(action).toHaveBeenCalledOnce();
    expect(header).not.toContainElement(
      screen.getByRole("textbox", { name: "Search plans" }),
    );
    expect(
      screen.getByRole("link", { name: "Back to home" }).parentElement,
    ).toHaveClass("hidden", "md:block");
  });

  it("removes page-specific title/actions when the page changes", () => {
    const page = (detail: boolean) => (
      <MobileAppHeaderProvider>
        <MobileAppHeader />
        {detail ? (
          <ScrollPage
            header={
              <PageHeader
                title="A long plan title"
                actions={<button>Plan actions</button>}
              />
            }
          >
            Detail
          </ScrollPage>
        ) : (
          <p>Chat</p>
        )}
      </MobileAppHeaderProvider>
    );
    const view = render(page(true));
    expect(
      screen.getByRole("button", { name: "Plan actions" }),
    ).toBeInTheDocument();
    pathname = "/coach";
    view.rerender(page(false));
    expect(
      screen.queryByRole("button", { name: "Plan actions" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("A long plan title")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Forge" })).toBeInTheDocument();
  });

  it("lets nested history views replace and restore the page action", () => {
    const view = (history: boolean) => (
      <MobileAppHeaderProvider>
        <MobileAppHeader />
        <ScrollPage
          header={
            <PageHeader title="Maxes" actions={<button>Add max</button>} />
          }
        >
          {history ? (
            <MobileHeaderContent
              title="Bench press"
              actions={<button>Close history</button>}
            />
          ) : null}
        </ScrollPage>
      </MobileAppHeaderProvider>
    );
    const result = render(view(true));
    expect(
      screen.getByRole("button", { name: "Close history" }),
    ).toBeInTheDocument();
    result.rerender(view(false));
    expect(
      screen.queryByRole("button", { name: "Close history" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add max" })).toBeInTheDocument();
  });
});
