import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkoutPlanArtifactPreview } from "@/components/artifact/workout-plan-artifact-preview";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

describe("WorkoutPlanArtifactPreview", () => {
  it("renders editable plan navigation with required props", () => {
    render(
      <WorkoutPlanArtifactPreview
        plan={minimalWorkoutPlan}
        runStatus="done"
        disabled={false}
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Week")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Back Squat")).toBeInTheDocument();
  });

  it("shows spinner overlay during sandbox runs", () => {
    render(
      <WorkoutPlanArtifactPreview
        plan={minimalWorkoutPlan}
        runStatus="sandbox"
        disabled={false}
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Working…")).toBeInTheDocument();
  });
});
