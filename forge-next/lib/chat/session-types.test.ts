import { describe, expect, it } from "vitest";
import { buildCoachWorkspaceSnapshot } from "@/lib/chat/session-types";

describe("buildCoachWorkspaceSnapshot", () => {
  it("captures eve cursor and ui cache fields", () => {
    expect(
      buildCoachWorkspaceSnapshot({
        forgeSessionId: "session-1",
        title: "Bench Press Block",
        ui: {
          planId: "plan-1",
          artifactTitle: "Strength Block",
          currentArtifact: null,
        },
        eve: {
          sessionId: "eve-1",
          continuationToken: "token",
          streamIndex: 3,
          events: [],
        },
      }),
    ).toEqual({
      forgeSessionId: "session-1",
      title: "Bench Press Block",
      ui: {
        planId: "plan-1",
        artifactTitle: "Strength Block",
        currentArtifact: null,
      },
      eve: {
        sessionId: "eve-1",
        continuationToken: "token",
        streamIndex: 3,
        events: [],
      },
    });
  });
});
