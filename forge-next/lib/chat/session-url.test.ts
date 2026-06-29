import { describe, expect, it, vi } from "vitest";
import {
  hasCoachSessionInUrl,
  hasCoachWorkspaceQueryParams,
  navigateToCoachHome,
  syncCoachSessionUrl,
  syncCoachWorkspaceUrl,
} from "@/lib/chat/session-url";

describe("syncCoachWorkspaceUrl", () => {
  it("adds sessionId and planId without navigating", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "https://example.com/coach?sessionId=session-42",
        pathname: "/coach",
        search: "?sessionId=session-42",
        hash: "",
      },
      history: {
        state: { idx: 0 },
        replaceState,
      },
    });

    syncCoachWorkspaceUrl({ planId: "plan-9" });

    expect(replaceState).toHaveBeenCalledWith(
      { idx: 0 },
      "",
      "/coach?sessionId=session-42&planId=plan-9",
    );
  });

  it("clears planId while keeping sessionId", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "https://example.com/coach?sessionId=session-42&planId=plan-9",
        pathname: "/coach",
        search: "?sessionId=session-42&planId=plan-9",
        hash: "",
      },
      history: {
        state: null,
        replaceState,
      },
    });

    syncCoachWorkspaceUrl({ sessionId: "session-42", planId: null });

    expect(replaceState).toHaveBeenCalledWith(
      null,
      "",
      "/coach?sessionId=session-42",
    );
  });
});

describe("syncCoachSessionUrl", () => {
  it("adds sessionId to the current URL without navigating", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "https://example.com/coach",
        pathname: "/coach",
        search: "",
        hash: "",
      },
      history: {
        state: { idx: 0 },
        replaceState,
      },
    });

    syncCoachSessionUrl("session-42");

    expect(replaceState).toHaveBeenCalledWith(
      { idx: 0 },
      "",
      "/coach?sessionId=session-42",
    );
  });

  it("removes sessionId from the current URL", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
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

    syncCoachSessionUrl(null);

    expect(replaceState).toHaveBeenCalledWith(null, "", "/coach");
  });

  it("does nothing when the URL is already in sync", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
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

    syncCoachSessionUrl("session-42");

    expect(replaceState).not.toHaveBeenCalled();
  });
});

describe("hasCoachSessionInUrl", () => {
  it("returns false when sessionId is absent", () => {
    vi.stubGlobal("window", {
      location: {
        href: "https://example.com/coach",
      },
    });

    expect(hasCoachSessionInUrl()).toBe(false);
  });

  it("returns true when sessionId is present", () => {
    vi.stubGlobal("window", {
      location: {
        href: "https://example.com/coach?sessionId=session-42",
      },
    });

    expect(hasCoachSessionInUrl()).toBe(true);
  });
});

describe("hasCoachWorkspaceQueryParams", () => {
  it("returns true when coach workspace query params are present", () => {
    expect(
      hasCoachWorkspaceQueryParams(new URLSearchParams("sessionId=session-1")),
    ).toBe(true);
    expect(hasCoachWorkspaceQueryParams(new URLSearchParams("planId=plan-1"))).toBe(
      true,
    );
    expect(hasCoachWorkspaceQueryParams(new URLSearchParams("new=1"))).toBe(true);
  });

  it("returns false on bare /coach", () => {
    expect(hasCoachWorkspaceQueryParams(new URLSearchParams())).toBe(false);
  });
});

describe("navigateToCoachHome", () => {
  it("clears workspace query params and refreshes the coach home route", () => {
    const replaceState = vi.fn();
    const replace = vi.fn();
    const refresh = vi.fn();

    vi.stubGlobal("window", {
      location: {
        href: "https://example.com/coach?sessionId=session-42&planId=plan-9&new=1",
        pathname: "/coach",
        search: "?sessionId=session-42&planId=plan-9&new=1",
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
