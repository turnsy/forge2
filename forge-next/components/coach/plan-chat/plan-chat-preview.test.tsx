import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlanChatPreview } from "@/components/coach/plan-chat/plan-chat-preview";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const samplePlan: WorkoutPlan = {
  schemaVersion: "2.0.0",
  name: "Strength",
  weeks: [],
};

describe("PlanChatPreview", () => {
  it("shows a loading state while awaiting the first plan", () => {
    render(
      <PlanChatPreview plan={null} runStatus="generating" isAwaitingPlan />,
    );
    expect(screen.getByLabelText("Generating")).toBeInTheDocument();
    expect(screen.queryByText("Plan preview")).not.toBeInTheDocument();
  });

  it("shows a muted placeholder when idle without a plan", () => {
    render(
      <PlanChatPreview plan={null} runStatus={null} isAwaitingPlan={false} />,
    );
    expect(screen.getByText(/will show here once it is ready/)).toBeInTheDocument();
  });

  it("renders PlanViewer when a valid plan is provided", () => {
    render(
      <PlanChatPreview plan={samplePlan} runStatus="done" isAwaitingPlan={false} />,
    );
    expect(screen.getByText("Weeks")).toBeInTheDocument();
  });

  it("shows a spinner overlay during sandbox when a plan exists", () => {
    render(
      <PlanChatPreview plan={samplePlan} runStatus="sandbox" isAwaitingPlan={false} />,
    );
    expect(screen.getByLabelText("Updating plan")).toBeInTheDocument();
  });
});
