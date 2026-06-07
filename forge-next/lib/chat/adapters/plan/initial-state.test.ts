import { describe, expect, it } from "vitest";
import { createEditPlanWorkspaceState } from "@/lib/chat/adapters/plan/initial-state";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

describe("createEditPlanWorkspaceState", () => {
  it("hydrates workspace for edit mode", () => {
    const state = createEditPlanWorkspaceState(minimalWorkoutPlan, "plan-1");

    expect(state).toMatchObject({
      hasStarted: true,
      artifactTitle: minimalWorkoutPlan.name,
      currentArtifact: minimalWorkoutPlan,
      planId: "plan-1",
      messages: [],
    });
  });
});
