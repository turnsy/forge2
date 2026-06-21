import { describe, expect, it } from "vitest";
import { buildSnapshotFromState } from "@/lib/chat/session-snapshot";
import type { ChatWorkspaceState } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

describe("buildSnapshotFromState", () => {
  it("captures the terminal workspace fields", () => {
    const state: ChatWorkspaceState<WorkoutPlan> = {
      sessionId: "session-1",
      hasStarted: true,
      artifactTitle: "Strength Block",
      planId: "plan-1",
      messages: [{ role: "user", content: "Build a plan" }],
      currentArtifact: null,
      contextFileIds: ["ctx-1"],
      attachments: [],
      runStatus: null,
      warnings: [],
      errors: [],
      phase: "streaming",
      streamingAssistantText: "partial",
    };

    expect(buildSnapshotFromState(state)).toEqual({
      title: null,
      messages: state.messages,
      currentArtifact: null,
      planId: "plan-1",
      artifactTitle: "Strength Block",
      contextFileIds: ["ctx-1"],
    });
  });
});
