import { describe, expect, it } from "vitest";
import { resolveCoachWorkspaceRemountKey } from "@/lib/chat/coach-workspace-key";

describe("resolveCoachWorkspaceRemountKey", () => {
  it("keeps server session keys while the workspace session id is present", () => {
    expect(
      resolveCoachWorkspaceRemountKey({
        serverKey: "session-abc",
        workspaceSessionId: "session-abc",
        homeNavigationEpoch: 0,
      }),
    ).toBe("session-abc");
  });

  it("remounts home when a server session is cleared from the URL", () => {
    expect(
      resolveCoachWorkspaceRemountKey({
        serverKey: "session-abc",
        workspaceSessionId: null,
        homeNavigationEpoch: 2,
      }),
    ).toBe("home-2");
  });

  it("does not remount home when replaceState adds a session id", () => {
    expect(
      resolveCoachWorkspaceRemountKey({
        serverKey: "coach-home",
        workspaceSessionId: "session-new",
        homeNavigationEpoch: 0,
      }),
    ).toBe("home-0");
  });

  it("remounts home when the navigation epoch advances", () => {
    expect(
      resolveCoachWorkspaceRemountKey({
        serverKey: "coach-home",
        workspaceSessionId: null,
        homeNavigationEpoch: 3,
      }),
    ).toBe("home-3");
  });

  it("preserves non-session server keys", () => {
    expect(
      resolveCoachWorkspaceRemountKey({
        serverKey: "plan-plan-9",
        workspaceSessionId: null,
        homeNavigationEpoch: 1,
      }),
    ).toBe("plan-plan-9");
  });
});
