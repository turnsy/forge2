import { describe, expect, it, vi } from "vitest";
import {
  hasCoachSessionInUrl,
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
