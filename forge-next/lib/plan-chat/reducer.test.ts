import { describe, expect, it } from "vitest";
import { createInitialPlanChatWorkspaceState } from "@/lib/plan-chat/initial-state";
import { planChatWorkspaceReducer } from "@/lib/plan-chat/reducer";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const samplePlan: WorkoutPlan = {
  schemaVersion: "2.0.0",
  name: "Block",
  weeks: [],
};

describe("planChatWorkspaceReducer", () => {
  it("commits assistant message on STREAM_END", () => {
    let state = planChatWorkspaceReducer(createInitialPlanChatWorkspaceState(), {
      type: "SEND_START",
      userMessage: "Build a plan",
    });
    state = {
      ...state,
      streamingAssistantText: "Here is your plan.",
    };
    state = planChatWorkspaceReducer(state, { type: "STREAM_END" });
    expect(state.messages).toHaveLength(2);
    expect(state.messages[1]).toEqual({
      role: "assistant",
      content: "Here is your plan.",
    });
    expect(state.streamingAssistantText).toBe("");
    expect(state.phase).toBe("idle");
  });

  it("keeps prior artifact when errors arrive after a valid artifact", () => {
    let state = {
      ...createInitialPlanChatWorkspaceState(),
      currentArtifact: samplePlan,
    };
    state = planChatWorkspaceReducer(state, {
      type: "APPLY_EVENT",
      event: {
        type: "errors",
        errors: [{ path: "/name", message: "Invalid" }],
      },
    });
    expect(state.currentArtifact).toEqual(samplePlan);
  });

  it("restarts workspace with a new draft id", () => {
    const state = planChatWorkspaceReducer(
      {
        ...createInitialPlanChatWorkspaceState("old-id"),
        hasStarted: true,
        messages: [{ role: "user", content: "Hi" }],
      },
      { type: "RESTART", draftId: "new-id" },
    );
    expect(state.draftId).toBe("new-id");
    expect(state.hasStarted).toBe(false);
    expect(state.messages).toHaveLength(0);
  });
});
