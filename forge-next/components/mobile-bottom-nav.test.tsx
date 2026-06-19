import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();
const usePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
    ref,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
    ref?: (node: HTMLAnchorElement | null) => void;
  }) => (
    <a
      ref={ref}
      href={href}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  ),
}));

import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX } from "@/lib/navigation/mobile-bottom-nav-layout";

function mockSlotRects(
  homeButton: HTMLElement,
  plansLink: HTMLElement,
  tray: HTMLElement,
) {
  vi.spyOn(tray, "getBoundingClientRect").mockReturnValue({
    left: 20,
    top: 500,
    right: 280,
    bottom: 556,
    width: 260,
    height: 56,
    x: 20,
    y: 500,
    toJSON: () => ({}),
  });
  vi.spyOn(homeButton, "getBoundingClientRect").mockReturnValue({
    left: 40,
    top: 502,
    right: 84,
    bottom: 546,
    width: 44,
    height: 44,
    x: 40,
    y: 502,
    toJSON: () => ({}),
  });
  vi.spyOn(plansLink, "getBoundingClientRect").mockReturnValue({
    left: 120,
    top: 502,
    right: 164,
    bottom: 546,
    width: 44,
    height: 44,
    x: 120,
    y: 502,
    toJSON: () => ({}),
  });
}

describe("MobileBottomNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathname.mockReturnValue("/coach");
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
  });

  it("renders a glass tray at roughly three quarters width with profile inside", () => {
    const { container } = render(
      <MobileBottomNav
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    const tray = container.querySelector(".w-3\\/4.overflow-visible");
    expect(tray).toBeTruthy();
    expect(tray?.querySelector('[aria-label="Open profile menu"]')).toBeTruthy();
  });

  it("renders coach navigation slots and profile menu", () => {
    render(
      <MobileBottomNav
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Plans" })).toHaveAttribute(
      "href",
      "/coach/plans",
    );
    expect(screen.getByRole("link", { name: "Athletes" })).toHaveAttribute(
      "href",
      "/coach/athletes",
    );
    expect(
      screen.getByRole("button", { name: "Open profile menu" }),
    ).toBeInTheDocument();
  });

  it("uses a wider rounded selection indicator", async () => {
    const { container } = render(
      <MobileBottomNav
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    const homeButton = screen.getByRole("button", { name: "Home" });
    const plansLink = screen.getByRole("link", { name: "Plans" });
    const tray = container.querySelector(".w-3\\/4.overflow-visible") as HTMLElement;

    mockSlotRects(homeButton, plansLink, tray);
    window.dispatchEvent(new Event("resize"));

    const indicator = await waitFor(() =>
      screen.getByTestId("nav-selection-indicator"),
    );
    expect(indicator.className).toContain("rounded-full");
    await waitFor(() => {
      expect(Number.parseFloat(indicator.style.width)).toBe(
        44 + MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX,
      );
    });
  });

  it("pans the selection indicator while dragging", () => {
    usePathname.mockReturnValue("/coach");
    const { container } = render(
      <MobileBottomNav
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    const homeButton = screen.getByRole("button", { name: "Home" });
    const plansLink = screen.getByRole("link", { name: "Plans" });
    const tray = container.querySelector(".w-3\\/4.overflow-visible") as HTMLElement;

    mockSlotRects(homeButton, plansLink, tray);

    fireEvent.pointerDown(homeButton, { clientX: 62, clientY: 525, pointerId: 1 });
    fireEvent.pointerMove(homeButton, { clientX: 80, clientY: 525, pointerId: 1 });
    fireEvent.pointerMove(homeButton, { clientX: 142, clientY: 525, pointerId: 1 });

    const indicator = screen.getByTestId("nav-selection-indicator");
    expect(Number.parseFloat(indicator.style.left)).toBeGreaterThan(20);
  });

  it("keeps the selection on the target tab after release while navigating", () => {
    usePathname.mockReturnValue("/coach");
    const { container } = render(
      <MobileBottomNav
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    const homeButton = screen.getByRole("button", { name: "Home" });
    const plansLink = screen.getByRole("link", { name: "Plans" });
    const tray = container.querySelector(".w-3\\/4.overflow-visible") as HTMLElement;

    mockSlotRects(homeButton, plansLink, tray);

    fireEvent.pointerDown(homeButton, { clientX: 62, clientY: 525, pointerId: 1 });
    fireEvent.pointerMove(homeButton, { clientX: 80, clientY: 525, pointerId: 1 });
    fireEvent.pointerMove(homeButton, { clientX: 142, clientY: 525, pointerId: 1 });
    fireEvent.pointerUp(homeButton, { clientX: 142, clientY: 525, pointerId: 1 });

    const indicator = screen.getByTestId("nav-selection-indicator");
    const plansMetricsLeft = 120 - 20 - MOBILE_BOTTOM_NAV_SELECTION_EXPAND_PX / 2;

    expect(mockPush).toHaveBeenCalledWith("/coach/plans");
    expect(Number.parseFloat(indicator.style.left)).toBeCloseTo(plansMetricsLeft, 0);
  });

  it("anchors the page while dragging", () => {
    render(
      <MobileBottomNav
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    const homeButton = screen.getByRole("button", { name: "Home" });

    fireEvent.pointerDown(homeButton, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(homeButton, { clientX: 40, clientY: 10, pointerId: 1 });

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.style.touchAction).toBe("none");

    fireEvent.pointerUp(homeButton, { clientX: 40, clientY: 10, pointerId: 1 });

    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.touchAction).toBe("");
  });

  it("highlights athlete home on athlete home", () => {
    usePathname.mockReturnValue("/athlete");

    render(
      <MobileBottomNav
        role="athlete"
        fullName="Athlete User"
        email="athlete@example.com"
      />,
    );

    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "History" })).toHaveAttribute(
      "href",
      "/athlete/history",
    );
  });

  it("hides settings for athlete role and keeps logout", async () => {
    const user = userEvent.setup();

    render(
      <MobileBottomNav
        role="athlete"
        fullName="Athlete User"
        email="athlete@example.com"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open profile menu" }));

    expect(
      screen.queryByRole("menuitem", { name: "Settings" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Log out" })).toBeInTheDocument();
  });

  it("opens the profile menu from the profile button", async () => {
    const user = userEvent.setup();

    render(
      <MobileBottomNav
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open profile menu" }));

    expect(screen.getByRole("menu", { name: "Profile menu" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/coach/settings",
    );
  });
});
