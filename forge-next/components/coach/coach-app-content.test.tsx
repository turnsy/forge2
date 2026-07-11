import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoachAppContent } from "@/components/coach/coach-app-content";
import {
  SessionNavigationProvider,
  useSessionNavigation,
} from "@/lib/chat/session-navigation-context";

const mockListTaskSessions = vi.fn();

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: (...args: unknown[]) => mockListTaskSessions(...args),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/coach",
}));

function StartNavigationButton() {
  const { startSessionNavigation } = useSessionNavigation();

  return (
    <button type="button" onClick={() => startSessionNavigation("session-1")}>
      Start navigation
    </button>
  );
}

describe("CoachAppContent", () => {
  beforeEach(() => {
    mockListTaskSessions.mockResolvedValue({ ok: true, sessions: [] });
  });

  it("shows the conversation loading view while a session is opening", async () => {
    const user = userEvent.setup();

    render(
      <SessionNavigationProvider>
        <CoachAppContent>
          <StartNavigationButton />
          <p>Workspace content</p>
        </CoachAppContent>
      </SessionNavigationProvider>,
    );

    expect(screen.getByText("Workspace content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Start navigation" }));

    expect(screen.getByLabelText("Loading conversation")).toBeInTheDocument();
    expect(screen.queryByText("Workspace content")).not.toBeInTheDocument();
  });
});

describe("CoachSessionLoadingView", () => {
  it("renders a centered loading state", async () => {
    const { CoachSessionLoadingView } = await import(
      "@/components/coach/coach-session-loading-view"
    );

    render(<CoachSessionLoadingView />);

    expect(screen.getByLabelText("Loading conversation")).toBeInTheDocument();
  });
});
