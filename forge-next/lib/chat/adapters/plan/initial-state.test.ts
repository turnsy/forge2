import { describe, expect, it } from "vitest";
import { createSessionWorkspaceState } from "@/lib/chat/adapters/plan/initial-state";

describe("createSessionWorkspaceState", () => {
  it("hydrates persisted snapshot fields into workspace state", () => {
    const state = createSessionWorkspaceState({
      id: "session-42",
      snapshot: {
        forgeSessionId: "session-42",
        title: "Hypertrophy Block",
        eve: {
          sessionId: "eve-1",
          continuationToken: "token",
        },
      },
    });

    expect(state.sessionId).toBe("session-42");
    expect(state.hasStarted).toBe(true);
    expect(state.messages).toEqual([]);
    expect(state.artifactTitle).toBe("");
    expect(state.contextFileIds).toEqual([]);
    expect(state.sessionTitle).toBe("Hypertrophy Block");
    expect(state.phase).toBe("idle");
    expect(state.streamingAssistantText).toBe("");
  });
});
