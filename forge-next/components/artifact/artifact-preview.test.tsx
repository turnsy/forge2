import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtifactPreview } from "@/components/artifact/artifact-preview";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

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

  it("renders workout plan artifacts with PlanViewer", () => {
    render(
      <ArtifactPreview
        artifact={{ type: "workout-plan", plan: samplePlan }}
        runStatus="done"
        isAwaitingArtifact={false}
      />,
    );
    expect(screen.getByText("Weeks")).toBeInTheDocument();
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
