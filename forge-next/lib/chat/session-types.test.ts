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
      },
    });
  });
});

describe("normalizeCoachWorkspaceSnapshot", () => {
  it("strips legacy event blobs from eve state", async () => {
    const { normalizeCoachWorkspaceSnapshot } = await import(
      "@/lib/chat/session-types"
    );

    expect(
      normalizeCoachWorkspaceSnapshot("session-1", {
        title: "Saved chat",
        forgeSessionId: "session-1",
        ui: {
          planId: null,
          artifactTitle: "",
          currentArtifact: null,
        },
        eve: {
          sessionId: "eve-1",
          continuationToken: "token",
          streamIndex: 2,
          events: [{ type: "message.received", data: { message: "Hi" } }],
        },
      }),
    ).toEqual({
      title: "Saved chat",
      forgeSessionId: "session-1",
      ui: {
        planId: null,
        artifactTitle: "",
        currentArtifact: null,
      },
      eve: {
        sessionId: "eve-1",
        continuationToken: "token",
        streamIndex: 2,
      },
    });
  });
});
