import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockPathname = vi.fn(() => "/coach");
const mockSearchParams = vi.fn(() => new URLSearchParams("sessionId=session-1"));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useSearchParams: () => mockSearchParams(),
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

import { CoachHomeNavLink } from "@/components/coach/coach-home-nav-link";

describe("CoachHomeNavLink", () => {
  it("forces a clean coach home navigation when workspace query params are present", async () => {
    const user = userEvent.setup();
    const replaceState = vi.fn();

    vi.stubGlobal("window", {
      location: {
        href: "https://example.com/coach?sessionId=session-1",
        pathname: "/coach",
        search: "?sessionId=session-1",
        hash: "",
      },
      history: {
        state: null,
        replaceState,
      },
    });

    render(<CoachHomeNavLink>Home</CoachHomeNavLink>);

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(replaceState).toHaveBeenCalledWith(null, "", "/coach");
    expect(mockReplace).toHaveBeenCalledWith("/coach");
    expect(mockRefresh).toHaveBeenCalled();
  });
});
