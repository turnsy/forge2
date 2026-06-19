import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SidebarProfileMenu } from "@/components/sidebar-profile-menu";

describe("SidebarProfileMenu", () => {
  it("renders profile name and email", () => {
    render(
      <SidebarProfileMenu
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    expect(screen.getByText("Coach User")).toBeInTheDocument();
    expect(screen.getByText("coach@example.com")).toBeInTheDocument();
  });

  it("applies role-specific border and focus classes to the toggle", () => {
    render(
      <SidebarProfileMenu
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    const trigger = screen.getByRole("button", { name: /Open profile menu/i });
    expect(trigger.className).toContain("!border-coach-muted");
    expect(trigger.className).toContain("focus-visible:ring-coach/50");
  });

  it("opens menu with settings and logout actions", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProfileMenu
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    const trigger = screen.getByRole("button", { name: /Open profile menu/i });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: /Settings/i })).toHaveAttribute(
      "href",
      "/coach/settings",
    );
    expect(
      screen.getByRole("menuitem", { name: /Log out/i }),
    ).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProfileMenu
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
      />,
    );

    const trigger = screen.getByRole("button", { name: /Open profile menu/i });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders chevron-only toggle when collapsed", () => {
    render(
      <SidebarProfileMenu
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
        collapsed
      />,
    );

    const trigger = screen.getByRole("button", { name: /Open profile menu/i });
    expect(screen.queryByText("Coach User")).not.toBeInTheDocument();
    expect(screen.queryByText("coach@example.com")).not.toBeInTheDocument();
    expect(trigger.className).not.toContain("!border-coach-muted");
    expect(trigger.className).toContain("justify-center");
  });

  it("opens menu from collapsed chevron toggle", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProfileMenu
        role="coach"
        fullName="Coach User"
        email="coach@example.com"
        collapsed
      />,
    );

    const trigger = screen.getByRole("button", { name: /Open profile menu/i });
    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: /Settings/i })).toHaveAttribute(
      "href",
      "/coach/settings",
    );
  });

  it("hides settings for athlete role and keeps logout", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProfileMenu
        role="athlete"
        fullName="Athlete User"
        email="athlete@example.com"
      />,
    );

    const trigger = screen.getByRole("button", { name: /Open profile menu/i });
    await user.click(trigger);

    expect(
      screen.queryByRole("menuitem", { name: /Settings/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /Log out/i }),
    ).toBeInTheDocument();
  });

  it("closes on outside click", async () => {
    const user = userEvent.setup();
    render(
      <>
        <div data-testid="outside">outside</div>
        <SidebarProfileMenu
          role="coach"
          fullName="Coach User"
          email="coach@example.com"
        />
      </>,
    );

    const trigger = screen.getByRole("button", { name: /Open profile menu/i });
    await user.click(trigger);
    fireEvent.mouseDown(screen.getByTestId("outside"));

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
