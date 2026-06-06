import { describe, expect, it } from "vitest";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import { createEditWorkspaceState } from "@/lib/plans/create-edit-workspace-state";

describe("createEditWorkspaceState", () => {
  it("hydrates workspace for edit mode", () => {
    const state = createEditWorkspaceState(minimalWorkoutPlan);

    expect(state).toMatchObject({
      hasStarted: true,
      artifactTitle: minimalWorkoutPlan.name,
      currentArtifact: minimalWorkoutPlan,
      messages: [],
    });
  });
});
