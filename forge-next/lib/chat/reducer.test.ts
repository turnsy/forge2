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
  it("stores mention segments on user messages", () => {
    const state = chatWorkspaceReducer(createInitialChatWorkspaceState(), {
      type: "SEND_START",
      userMessage: "Edit @Summer Block",
      userSegments: [
        { type: "text", value: "Edit " },
        {
          type: "mention",
          kind: "plan",
          id: "plan-1",
          label: "Summer Block",
        },
      ],
    });

    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toMatchObject({
      role: "user",
      content: "Edit @Summer Block",
      segments: [
        { type: "text", value: "Edit " },
        {
          type: "mention",
          kind: "plan",
          id: "plan-1",
          label: "Summer Block",
        },
      ],
    });
  });

  it("commits assistant message on STREAM_END", () => {
    let state = chatWorkspaceReducer(createInitialChatWorkspaceState(), {
      type: "SEND_START",
      userMessage: "Build a plan",
    });
    state = {
      ...state,
      streamingAssistantText: "Here is your plan.",
      runStatus: "done",
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

  it("surfaces an error when the stream ends before runStatus is done", () => {
    let state = chatWorkspaceReducer(createInitialChatWorkspaceState(), {
      type: "SEND_START",
      userMessage: "Build a full plan from my sheet",
    });
    state = chatWorkspaceReducer(state, {
      type: "APPLY_EVENT",
      event: { type: "runStatus", status: "generating" },
    });

    state = chatWorkspaceReducer(state, { type: "STREAM_END" });

    expect(state.phase).toBe("error");
    expect(state.runStatus).toBe("error");
    expect(state.errors[0]?.code).toBe("STREAM_INTERRUPTED");
    expect(state.errors[0]?.message).toMatch(/stopped before finishing/i);
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

  it("stores artifact updates from SET_ARTIFACT", () => {
    const state = chatWorkspaceReducer(
      createInitialChatWorkspaceState<WorkoutPlan>(),
      { type: "SET_ARTIFACT", artifact: samplePlan },
    );

    expect(state.currentArtifact).toEqual(samplePlan);
  });

  it("restarts workspace with a new draft id", () => {
    const state = chatWorkspaceReducer(
      {
        ...createInitialChatWorkspaceState("old-id"),
        hasStarted: true,
        messages: [{ role: "user", content: "Hi" }],
      },
      { type: "RESTART", sessionId: "new-id" },
    );
    expect(state.sessionId).toBe("new-id");
    expect(state.hasStarted).toBe(false);
    expect(state.messages).toHaveLength(0);
  });
});
