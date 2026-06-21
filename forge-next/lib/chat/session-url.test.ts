import { describe, expect, it, vi } from "vitest";
import { syncCoachSessionUrl } from "@/lib/chat/session-url";

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
