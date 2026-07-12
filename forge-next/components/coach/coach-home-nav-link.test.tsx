import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoachHomeNavLink } from "@/components/coach/coach-home-nav-link";
import { SessionNavigationProvider } from "@/lib/chat/session-navigation-context";

const mockListTaskSessions = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockPathname = vi.fn(() => "/coach");
const mockSearchParams = vi.fn(() => new URLSearchParams("sessionId=session-1"));

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
}));

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
    mockListTaskSessions.mockResolvedValue({ ok: true, sessions: [] });
    mockPathname.mockReturnValue("/coach");
  });

  it("forces a clean coach home navigation when workspace query params are present", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-1"));
    window.history.replaceState(null, "", "/coach?sessionId=session-1");

    render(
      <SessionNavigationProvider>
        <CoachHomeNavLink>Home</CoachHomeNavLink>
      </SessionNavigationProvider>,
    );

    await user.click(screen.getByRole("link", { name: "Home" }));

    expect(mockReplace).toHaveBeenCalledWith("/coach");
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("is not active when a session id is in the URL", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("sessionId=session-new"));
    window.history.replaceState(null, "", "/coach?sessionId=session-new");

    render(
      <SessionNavigationProvider>
        <CoachHomeNavLink>Home</CoachHomeNavLink>
      </SessionNavigationProvider>,
    );

    const homeClasses = screen
      .getByRole("link", { name: "Home" })
      .className.split(/\s+/);

    expect(homeClasses).toContain("text-surface-muted");
    expect(homeClasses).not.toContain("bg-glass");
  });
});
