import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

import { Sidebar } from "@/components/sidebar";

describe("Sidebar", () => {
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

  it("collapses to icon-only nav and hides profile menu", async () => {
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
});
