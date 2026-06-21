import { describe, expect, it } from "vitest";
import { createSessionWorkspaceState } from "@/lib/chat/adapters/plan/initial-state";

describe("createSessionWorkspaceState", () => {
  it("hydrates persisted snapshot fields into workspace state", () => {
    const state = createSessionWorkspaceState({
      id: "session-42",
      snapshot: {
        messages: [
          { role: "user", content: "Build me a plan" },
          { role: "assistant", content: "Sure." },
        ],
        currentArtifact: null,
        planId: null,
        artifactTitle: "Draft",
        contextFileIds: ["ctx-1"],
        title: "Hypertrophy Block",
      },
    });

    expect(state.sessionId).toBe("session-42");
    expect(state.hasStarted).toBe(true);
    expect(state.messages).toHaveLength(2);
    expect(state.artifactTitle).toBe("Draft");
    expect(state.contextFileIds).toEqual(["ctx-1"]);
    expect(state.sessionTitle).toBe("Hypertrophy Block");
    expect(state.phase).toBe("idle");
    expect(state.streamingAssistantText).toBe("");
  });
});
