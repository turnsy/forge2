import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const usePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    "aria-label": ariaLabel,
    title,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
    title?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel} title={title}>
      {children}
    </a>
  ),
}));

import { SidebarNavLink } from "@/components/ui/sidebar-nav-link";

describe("SidebarNavLink", () => {
  it("marks home active only on exact match", () => {
    usePathname.mockReturnValue("/coach/plans");

    render(
      <SidebarNavLink href="/coach" exact>
        Home
      </SidebarNavLink>,
    );

    const homeLink = screen.getByRole("link", { name: "Home" });
    const homeClasses = homeLink.className.split(/\s+/);

    expect(homeClasses).toContain("text-surface-muted");
    expect(homeClasses).not.toContain("bg-glass");
  });

  it("marks nested routes active for prefix matches", () => {
    usePathname.mockReturnValue("/coach/plans/weekly");

    render(<SidebarNavLink href="/coach/plans">Plans</SidebarNavLink>);

    const plansClasses = screen
      .getByRole("link", { name: "Plans" })
      .className.split(/\s+/);

    expect(plansClasses).toContain("bg-glass");
    expect(plansClasses).toContain("text-surface-foreground");
  });

  it("hides visible label and exposes aria-label when collapsed", () => {
    usePathname.mockReturnValue("/coach");

    render(
      <SidebarNavLink href="/coach/plans" collapsed>
        Plans
      </SidebarNavLink>,
    );

    const link = screen.getByRole("link", { name: "Plans" });
    expect(link).toHaveAttribute("aria-label", "Plans");
    expect(link).toHaveClass("justify-center");
    expect(screen.queryByText("Plans", { selector: "span:not(.sr-only)" })).toBeNull();
  });
});
