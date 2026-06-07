import { describe, expect, it } from "vitest";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import { chatWorkspaceReducer } from "@/lib/chat/reducer";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const samplePlan: WorkoutPlan = {
  schemaVersion: "2.0.0",
  name: "Block",
  weeks: [],
};

describe("chatWorkspaceReducer", () => {
  it("commits assistant message on STREAM_END", () => {
    let state = chatWorkspaceReducer(createInitialChatWorkspaceState(), {
      type: "SEND_START",
      userMessage: "Build a plan",
    });
    state = {
      ...state,
      streamingAssistantText: "Here is your plan.",
    };
    state = chatWorkspaceReducer(state, { type: "STREAM_END" });
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
      ...createInitialChatWorkspaceState<WorkoutPlan>(),
      currentArtifact: samplePlan,
    };
    state = chatWorkspaceReducer(state, {
      type: "APPLY_EVENT",
      event: {
        type: "errors",
        errors: [{ path: "/name", message: "Invalid" }],
      },
    });
    expect(state.currentArtifact).toEqual(samplePlan);
  });

  it("restarts workspace with a new draft id", () => {
    const state = chatWorkspaceReducer(
      {
        ...createInitialChatWorkspaceState("old-id"),
        hasStarted: true,
        planId: "plan-1",
        messages: [{ role: "user", content: "Hi" }],
      },
      { type: "RESTART", sessionId: "new-id" },
    );
    expect(state.sessionId).toBe("new-id");
    expect(state.hasStarted).toBe(false);
    expect(state.planId).toBeNull();
    expect(state.messages).toHaveLength(0);
  });

  it("sets planId on SET_PLAN_ID", () => {
    const state = chatWorkspaceReducer(createInitialChatWorkspaceState(), {
      type: "SET_PLAN_ID",
      planId: "plan-1",
    });
    expect(state.planId).toBe("plan-1");
  });
});
