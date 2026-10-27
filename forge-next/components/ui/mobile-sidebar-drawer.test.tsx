import { fireEvent, render, screen } from "@testing-library/react";
import Link from "next/link";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileSidebarDrawer } from "./mobile-sidebar-drawer";

let pathname = "/coach";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));

beforeEach(() => {
  pathname = "/coach";
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

function setup() {
  return render(<MobileSidebarDrawer><Link href="/coach/plans">Plans</Link></MobileSidebarDrawer>);
}

describe("MobileSidebarDrawer", () => {
  it("opens from the floating icon, locks scrolling, and restores focus when closed", async () => {
    const user = userEvent.setup();
    document.body.style.overflow = "auto";
    setup();
    const trigger = screen.getByRole("button", { name: "Open sidebar" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Main navigation" })).toBeVisible();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(document.body.style.overflow).toBe("hidden");
    await user.click(screen.getByRole("button", { name: "Close sidebar" }));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe("auto");
    document.body.style.overflow = "";
  });

  it("dismisses on navigation and backdrop clicks", async () => {
    const user = userEvent.setup();
    setup();
    const trigger = screen.getByRole("button", { name: "Open sidebar" });
    await user.click(trigger);
    // Prevent jsdom from attempting real navigation.
    screen.getByRole("link").addEventListener("click", event => event.preventDefault());
    await user.click(screen.getByRole("link"));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    fireEvent.click(screen.getByRole("dialog"));
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with an edge swipe, ignores vertical gestures, and closes with a left swipe", () => {
    setup();
    const trigger = screen.getByRole("button", { name: "Open sidebar" });
    const swipe = (x: number, y: number, endX: number, endY: number) => {
      fireEvent.touchStart(document, { touches: [{ clientX: x, clientY: y }] });
      fireEvent.touchEnd(document, { changedTouches: [{ clientX: endX, clientY: endY }] });
    };
    swipe(100, 100, 200, 100);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    swipe(10, 100, 80, 250);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    swipe(10, 100, 100, 105);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    swipe(180, 100, 80, 105);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when the route changes and unlocks scrolling on unmount", async () => {
    const user = userEvent.setup();
    const view = setup();
    await user.click(screen.getByRole("button", { name: "Open sidebar" }));
    pathname = "/coach/plans";
    view.rerender(<MobileSidebarDrawer><Link href="/coach/plans">Plans</Link></MobileSidebarDrawer>);
    expect(screen.getByRole("button", { name: "Open sidebar" })).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: "Open sidebar" }));
    view.unmount();
    expect(document.body.style.overflow).toBe("");
  });
});
