import { describe, expect, it } from "vitest";
import { buildCoachWorkspaceSnapshot } from "@/lib/chat/session-types";

describe("buildCoachWorkspaceSnapshot", () => {
  it("captures forge identity, title, and eve pointer", () => {
    expect(
      buildCoachWorkspaceSnapshot({
        forgeSessionId: "session-1",
        title: "Bench Press Block",
        eve: {
          sessionId: "eve-1",
          continuationToken: "token",
        },
      }),
    ).toEqual({
      forgeSessionId: "session-1",
      title: "Bench Press Block",
      eve: {
        sessionId: "eve-1",
        continuationToken: "token",
      },
    });
  });
});
