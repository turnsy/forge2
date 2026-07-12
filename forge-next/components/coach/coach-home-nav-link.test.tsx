import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoachHomeNavLink } from "@/components/coach/coach-home-nav-link";
import { COACH_WORKSPACE_URL_CHANGE_EVENT } from "@/lib/chat/session-url";

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
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe("CoachHomeNavLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue("/coach");
    window.history.replaceState(null, "", "/coach");
  });

  it("forces a clean coach home navigation when workspace query params are present", async () => {
    const user = userEvent.setup();
    const replaceState = vi.fn();
    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-1"));

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
      addEventListener: window.addEventListener.bind(window),
      removeEventListener: window.removeEventListener.bind(window),
      dispatchEvent: window.dispatchEvent.bind(window),
    });

    render(<CoachHomeNavLink>Home</CoachHomeNavLink>);

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(replaceState).toHaveBeenCalledWith(null, "", "/coach");
    expect(mockReplace).toHaveBeenCalledWith("/coach");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("is not active after replaceState adds a session id", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams());
    window.history.replaceState(null, "", "/coach?sessionId=session-new");
    window.dispatchEvent(new Event(COACH_WORKSPACE_URL_CHANGE_EVENT));

    render(<CoachHomeNavLink>Home</CoachHomeNavLink>);

    const homeClasses = screen
      .getByRole("link", { name: "Home" })
      .className.split(/\s+/);

    expect(homeClasses).toContain("text-surface-muted");
    expect(homeClasses).not.toContain("bg-glass");
  });
});
