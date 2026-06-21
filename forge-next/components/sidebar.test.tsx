import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const usePathname = vi.fn();
const mockUseIsMobile = vi.fn(() => false);
const mockPush = vi.fn();

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: vi.fn(async () => ({ ok: true, sessions: [] })),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    role,
    onClick,
    "aria-label": ariaLabel,
    title,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    role?: string;
    onClick?: () => void;
    "aria-label"?: string;
    title?: string;
  }) => (
    <a
      href={href}
      className={className}
      role={role}
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </a>
  ),
}));

import { Sidebar } from "@/components/sidebar";

describe("Sidebar", () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false);
  });

  it("renders Forge text and profile menu when expanded", () => {
    usePathname.mockReturnValue("/coach");

    render(
      <Sidebar
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    expect(screen.getByText("Forge")).toBeInTheDocument();
    expect(screen.getByText("Coach User")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plans" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Athletes" })).toBeInTheDocument();
  });

  it("collapses to icon-only nav and profile chevron", async () => {
    const user = userEvent.setup();
    usePathname.mockReturnValue("/coach");

    render(
      <Sidebar
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Collapse sidebar/i }),
    );

    expect(screen.queryByText("Forge")).not.toBeInTheDocument();
    expect(screen.queryByText("Coach User")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plans" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Athletes" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Expand sidebar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Open profile menu/i }),
    ).toBeInTheDocument();
  });

  it("opens profile menu from collapsed chevron", async () => {
    const user = userEvent.setup();
    usePathname.mockReturnValue("/coach");

    render(
      <Sidebar
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Collapse sidebar/i }),
    );
    await user.click(screen.getByRole("button", { name: /Open profile menu/i }));

    expect(
      screen.getByRole("menuitem", { name: /Settings/i }),
    ).toHaveAttribute("href", "/coach/settings");
    expect(
      screen.getByRole("menuitem", { name: /Log out/i }),
    ).toBeInTheDocument();
  });

  it("expands again from collapsed state", async () => {
    const user = userEvent.setup();
    usePathname.mockReturnValue("/coach");

    render(
      <Sidebar
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: /Collapse sidebar/i }),
    );
    await user.click(screen.getByRole("button", { name: /Expand sidebar/i }));

    expect(screen.getByText("Forge")).toBeInTheDocument();
    expect(screen.getByText("Coach User")).toBeInTheDocument();
  });

  it("does not render on mobile", () => {
    mockUseIsMobile.mockReturnValue(true);
    usePathname.mockReturnValue("/coach");

    const { container } = render(
      <Sidebar
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
