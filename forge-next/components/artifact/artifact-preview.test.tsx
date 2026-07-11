import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArtifactPreview } from "@/components/artifact/artifact-preview";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

const samplePlan: WorkoutPlan = {
  schemaVersion: "3.0.0",
  name: "Strength",
  weeks: [],
};

const noopPlanChange = vi.fn();

describe("ArtifactPreview", () => {
  it("shows the turn activity indicator while awaiting the first artifact", () => {
    render(
      <ArtifactPreview
        artifact={null}
        runStatus="generating"
        phase="streaming"
        isAwaitingArtifact
        disabled={false}
        onPlanChange={noopPlanChange}
      />,
    );
    expect(screen.getByText("Generating")).toBeInTheDocument();
  });

  it("shows a generic placeholder when idle without an artifact", () => {
    render(
      <ArtifactPreview
        artifact={null}
        runStatus={null}
        isAwaitingArtifact={false}
        disabled={false}
        onPlanChange={noopPlanChange}
      />,
    );
    expect(screen.getByText("Working…")).toBeInTheDocument();
  });

  it("renders workout plan artifacts with day navigation", () => {
    render(
      <ArtifactPreview
        artifact={{ type: "workout-plan", plan: minimalWorkoutPlan }}
        runStatus="done"
        isAwaitingArtifact={false}
        disabled={false}
        onPlanChange={noopPlanChange}
      />,
    );
    expect(screen.getByLabelText("Week")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Back Squat")).toBeInTheDocument();
  });

  it("shows a spinner overlay during sandbox when an artifact exists", () => {
    render(
      <ArtifactPreview
        artifact={{ type: "workout-plan", plan: samplePlan }}
        runStatus="sandbox"
        phase="streaming"
        isAwaitingArtifact={false}
        disabled={false}
        onPlanChange={noopPlanChange}
      />,
    );
    expect(screen.getByText("Building")).toBeInTheDocument();
  });

  it("shows a spinner overlay while generating even before sandbox", () => {
    render(
      <ArtifactPreview
        artifact={{ type: "workout-plan", plan: samplePlan }}
        runStatus="generating"
        phase="streaming"
        isAwaitingArtifact={false}
        disabled={false}
        onPlanChange={noopPlanChange}
      />,
    );
    expect(screen.getByText("Generating")).toBeInTheDocument();
  });
});
