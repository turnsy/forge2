import { describe, expect, it } from "vitest";
import { applyPlanChatEvent } from "@/lib/plan-chat/apply-plan-chat-event";
import { createInitialPlanChatWorkspaceState } from "@/lib/plan-chat/initial-state";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const samplePlan: WorkoutPlan = {
  schemaVersion: "2.0.0",
  name: "Test",
  weeks: [],
};

describe("applyPlanChatEvent", () => {
  it("accumulates assistant text deltas", () => {
    let state = createInitialPlanChatWorkspaceState();
    state = applyPlanChatEvent(state, {
      type: "assistantTextDelta",
      delta: "Hello ",
    });
    state = applyPlanChatEvent(state, {
      type: "assistantTextDelta",
      delta: "world",
    });
    expect(state.streamingAssistantText).toBe("Hello world");
  });

  it("updates currentArtifact on artifact event", () => {
    const state = applyPlanChatEvent(createInitialPlanChatWorkspaceState(), {
      type: "artifact",
      plan: samplePlan,
    });
    expect(state.currentArtifact).toEqual(samplePlan);
    expect(state.planTitle).toBe("Test");
  });

  it("does not clear currentArtifact on errors", () => {
    const initial = {
      ...createInitialPlanChatWorkspaceState(),
      currentArtifact: samplePlan,
    };
    const state = applyPlanChatEvent(initial, {
      type: "errors",
      errors: [{ path: "/weeks", message: "Required" }],
    });
    expect(state.currentArtifact).toEqual(samplePlan);
    expect(state.errors).toHaveLength(1);
  });
});
