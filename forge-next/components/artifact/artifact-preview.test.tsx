import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArtifactPreview } from "@/components/artifact/artifact-preview";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

const samplePlan: WorkoutPlan = {
  schemaVersion: "2.0.0",
  name: "Strength",
  weeks: [],
};

describe("ArtifactPreview", () => {
  it("shows a loading state while awaiting the first artifact", () => {
    render(
      <ArtifactPreview
        artifact={null}
        runStatus="generating"
        isAwaitingArtifact
      />,
    );
    expect(screen.getByLabelText("Generating")).toBeInTheDocument();
  });

  it("shows a generic placeholder when idle without an artifact", () => {
    render(
      <ArtifactPreview
        artifact={null}
        runStatus={null}
        isAwaitingArtifact={false}
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
      />,
    );
    expect(screen.getByLabelText("Week")).toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });

  it("shows a spinner overlay during sandbox when an artifact exists", () => {
    render(
      <ArtifactPreview
        artifact={{ type: "workout-plan", plan: samplePlan }}
        runStatus="sandbox"
        isAwaitingArtifact={false}
      />,
    );
    expect(screen.getByLabelText("Working…")).toBeInTheDocument();
  });
});
