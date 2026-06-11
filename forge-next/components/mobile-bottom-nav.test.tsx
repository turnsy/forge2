import { fireEvent, render, screen } from "@testing-library/react";
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

describe("MobileBottomNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathname.mockReturnValue("/coach");
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
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

  it("navigates when dragging the active tab onto another tab", () => {
    usePathname.mockReturnValue("/coach");
    render(
      <MobileBottomNav
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    const homeButton = screen.getByRole("button", { name: "Home" });
    const plansLink = screen.getByRole("link", { name: "Plans" });

    vi.spyOn(homeButton, "getBoundingClientRect").mockReturnValue({
      left: 40,
      top: 500,
      right: 90,
      bottom: 550,
      width: 50,
      height: 50,
      x: 40,
      y: 500,
      toJSON: () => ({}),
    });
    vi.spyOn(plansLink, "getBoundingClientRect").mockReturnValue({
      left: 100,
      top: 500,
      right: 150,
      bottom: 550,
      width: 50,
      height: 50,
      x: 100,
      y: 500,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(homeButton, { clientX: 65, clientY: 525, pointerId: 1 });
    fireEvent.pointerMove(homeButton, { clientX: 80, clientY: 525, pointerId: 1 });
    fireEvent.pointerMove(homeButton, { clientX: 125, clientY: 525, pointerId: 1 });
    fireEvent.pointerUp(homeButton, { clientX: 125, clientY: 525, pointerId: 1 });

    expect(mockPush).toHaveBeenCalledWith("/coach/plans");
    expect(document.body.style.overflow).toBe("");
    expect(document.body.style.touchAction).toBe("");
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
