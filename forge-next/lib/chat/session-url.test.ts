import { describe, expect, it, vi } from "vitest";
import {
  hasCoachWorkspaceQueryParams,
  navigateToCoachHome,
  navigateToCoachSession,
  navigateToCoachWorkspace,
  shouldForceCoachHomeNavigation,
} from "@/lib/chat/session-url";

describe("hasCoachWorkspaceQueryParams", () => {
  it("returns true when sessionId is present", () => {
    expect(
      hasCoachWorkspaceQueryParams(new URLSearchParams("sessionId=session-1")),
    ).toBe(true);
  });

  it("returns true when planId is present", () => {
    expect(hasCoachWorkspaceQueryParams(new URLSearchParams("planId=plan-9"))).toBe(
      true,
    );
  });

  it("returns true when new plan flag is present", () => {
    expect(hasCoachWorkspaceQueryParams(new URLSearchParams("new=1"))).toBe(true);
  });

  it("returns false on bare /coach", () => {
    expect(hasCoachWorkspaceQueryParams(new URLSearchParams())).toBe(false);
  });
});

describe("navigateToCoachHome", () => {
  it("replaces the coach home route and refreshes", () => {
    const replace = vi.fn();
    const refresh = vi.fn();

    navigateToCoachHome({ replace, refresh });

    expect(replace).toHaveBeenCalledWith("/coach");
    expect(refresh).toHaveBeenCalled();
  });
});

describe("navigateToCoachSession", () => {
  it("pushes the session route and refreshes server content", () => {
    const push = vi.fn();
    const refresh = vi.fn();

    navigateToCoachSession({ push, refresh }, "session-42");

    expect(push).toHaveBeenCalledWith("/coach?sessionId=session-42");
    expect(refresh).toHaveBeenCalled();
  });
});

describe("navigateToCoachWorkspace", () => {
  it("replaces the workspace URL with the provided params", () => {
    const replace = vi.fn();
    const refresh = vi.fn();

    navigateToCoachWorkspace(
      { replace, refresh },
      { sessionId: "session-42", planId: "plan-9" },
    );

    expect(replace).toHaveBeenCalledWith(
      "/coach?sessionId=session-42&planId=plan-9",
    );
    expect(refresh).toHaveBeenCalled();
  });
});

describe("shouldForceCoachHomeNavigation", () => {
  it("returns true on /coach with workspace query params", () => {
    expect(
      shouldForceCoachHomeNavigation(
        "/coach",
        new URLSearchParams("sessionId=session-1"),
      ),
    ).toBe(true);
  });

  it("returns false on bare /coach", () => {
    expect(shouldForceCoachHomeNavigation("/coach", new URLSearchParams())).toBe(
      false,
    );
  });
});
