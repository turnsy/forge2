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
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
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
});
