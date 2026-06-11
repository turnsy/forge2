import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseIsMobile = vi.fn(() => true);
const mockUsePathname = vi.fn(() => "/coach/plans");

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("@/components/sidebar", () => ({
  Sidebar: () => <aside data-testid="sidebar" />,
}));

vi.mock("@/components/mobile-bottom-nav", () => ({
  MobileBottomNav: () => <nav data-testid="mobile-bottom-nav" />,
}));

import { AppShell } from "@/components/app-shell";

describe("AppShell", () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(true);
    mockUsePathname.mockReturnValue("/coach/plans");
  });

  it("lets page content scroll under the bottom nav by default", () => {
    const { container } = render(
      <AppShell role="coach" fullName="Coach" email="coach@example.com">
        <div>Page</div>
      </AppShell>,
    );

    const mainColumn = container.querySelector(".flex.min-h-0.flex-1.flex-col");
    expect(mainColumn?.className).not.toContain("pb-[calc(4.5rem");
  });

  it("does not reserve bottom space on the coach prompt page", () => {
    mockUsePathname.mockReturnValue("/coach");

    const { container } = render(
      <AppShell role="coach" fullName="Coach" email="coach@example.com">
        <div>Prompt</div>
      </AppShell>,
    );

    const mainColumn = container.querySelector(".flex.min-h-0.flex-1.flex-col");
    expect(mainColumn?.className).not.toContain("pb-[calc(4.5rem");
  });
});
