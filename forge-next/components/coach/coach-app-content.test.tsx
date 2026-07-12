import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CoachAppContent } from "@/components/coach/coach-app-content";
import { SessionNavigationProvider } from "@/lib/chat/session-navigation-context";

vi.mock("@/lib/chat/actions", () => ({
  listTaskSessions: vi.fn(async () => ({ ok: true, sessions: [] })),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe("CoachAppContent", () => {
  it("renders children directly", () => {
    render(
      <SessionNavigationProvider>
        <CoachAppContent>
          <p>Workspace content</p>
        </CoachAppContent>
      </SessionNavigationProvider>,
    );

    expect(screen.getByText("Workspace content")).toBeInTheDocument();
  });
});
