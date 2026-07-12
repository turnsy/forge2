import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasCoachWorkspaceQueryParams,
  navigateToCoachHome,
  navigateToCoachSession,
  navigateToCoachWorkspace,
  shouldForceCoachHomeNavigation,
  syncCoachSessionUrl,
  syncCoachWorkspaceUrl,
} from "@/lib/chat/session-url";

function stubWindow({
  location,
  history,
}: {
  location: {
    href: string;
    pathname: string;
    search: string;
    hash: string;
  };
  history: {
    state: unknown;
    replaceState: ReturnType<typeof vi.fn>;
  };
}) {
  vi.stubGlobal("window", {
    location,
    history,
    dispatchEvent: vi.fn(),
  });
}

describe("syncCoachSessionUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates the browser URL without a router navigation", () => {
    const replaceState = vi.fn();

    stubWindow({
      location: {
        href: "https://example.com/coach",
        pathname: "/coach",
        search: "",
        hash: "",
      },
      history: {
        state: null,
        replaceState,
      },
    });

    syncCoachSessionUrl("session-42");

    expect(replaceState).toHaveBeenCalledWith(null, "", "/coach?sessionId=session-42");
  });
});

describe("syncCoachWorkspaceUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("can set session and plan params together", () => {
    const replaceState = vi.fn();

    stubWindow({
      location: {
        href: "https://example.com/coach?sessionId=session-42",
        pathname: "/coach",
        search: "?sessionId=session-42",
        hash: "",
      },
      history: {
        state: null,
        replaceState,
      },
    });

    syncCoachWorkspaceUrl({ sessionId: "session-42", planId: "plan-9" });

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/coach?sessionId=session-42&planId=plan-9",
    );
  });
});

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
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears workspace query params, replaces the route, and refreshes", () => {
    const replaceState = vi.fn();
    const replace = vi.fn();
    const refresh = vi.fn();

    stubWindow({
      location: {
        href: "https://example.com/coach?sessionId=session-42",
        pathname: "/coach",
        search: "?sessionId=session-42",
        hash: "",
      },
      history: {
        state: null,
        replaceState,
      },
    });

    navigateToCoachHome({ replace, refresh });

    expect(replaceState).toHaveBeenCalledWith(null, "", "/coach");
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
