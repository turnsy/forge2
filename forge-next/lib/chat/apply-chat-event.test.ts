import { describe, expect, it } from "vitest";
import { applyChatEvent } from "@/lib/chat/apply-chat-event";
import { createInitialChatWorkspaceState } from "@/lib/chat/initial-state";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const samplePlan: WorkoutPlan = {
  schemaVersion: "2.0.0",
  name: "Test",
  weeks: [],
};

describe("applyChatEvent", () => {
  it("accumulates assistant text deltas", () => {
    let state = createInitialChatWorkspaceState<WorkoutPlan>();
    state = applyChatEvent(state, {
      type: "assistantTextDelta",
      delta: "Hello ",
    });
    state = applyChatEvent(state, {
      type: "assistantTextDelta",
      delta: "world",
    });
    expect(state.streamingAssistantText).toBe("Hello world");
  });

  it("updates currentArtifact on artifact event", () => {
    const state = applyChatEvent(createInitialChatWorkspaceState<WorkoutPlan>(), {
      type: "artifact",
      artifact: samplePlan,
      title: "Test",
    });
    expect(state.currentArtifact).toEqual(samplePlan);
    expect(state.artifactTitle).toBe("Test");
  });

  it("updates artifact and planId on setArtifact event", () => {
    const state = applyChatEvent(createInitialChatWorkspaceState<WorkoutPlan>(), {
      type: "setArtifact",
      artifact: samplePlan,
      title: "Test",
      planId: "plan-1",
    });
    expect(state.currentArtifact).toEqual(samplePlan);
    expect(state.planId).toBe("plan-1");
  });

  it("accumulates warnings events", () => {
    let state = createInitialChatWorkspaceState<WorkoutPlan>();
    state = applyChatEvent(state, {
      type: "warnings",
      warnings: ["CSV truncated"],
    });
    state = applyChatEvent(state, {
      type: "warnings",
      warnings: ["PDF page cap reached"],
    });
    expect(state.warnings).toEqual([
      "CSV truncated",
      "PDF page cap reached",
    ]);
  });

  it("clears artifact and planId on clearArtifact", () => {
    const initial = {
      ...createInitialChatWorkspaceState<WorkoutPlan>(),
      currentArtifact: samplePlan,
      artifactTitle: "Test",
      planId: "plan-1",
    };
    const state = applyChatEvent(initial, { type: "clearArtifact" });
    expect(state.currentArtifact).toBeNull();
    expect(state.artifactTitle).toBe("");
    expect(state.planId).toBeNull();
  });

  it("does not clear currentArtifact on errors", () => {
    const initial = {
      ...createInitialChatWorkspaceState<WorkoutPlan>(),
      currentArtifact: samplePlan,
    };
    const state = applyChatEvent(initial, {
      type: "errors",
      errors: [{ path: "/weeks", message: "Required" }],
    });
    expect(state.currentArtifact).toEqual(samplePlan);
    expect(state.errors).toHaveLength(1);
  });
});
