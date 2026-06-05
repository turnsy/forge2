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
  it("shows empty state when there is no plan", () => {
    render(<PlanChatPreview plan={null} runStatus={null} />);
    expect(screen.getByText("Plan preview")).toBeInTheDocument();
  });

  it("renders PlanViewer when a valid plan is provided", () => {
    render(<PlanChatPreview plan={samplePlan} runStatus="done" />);
    expect(screen.getByText("Weeks")).toBeInTheDocument();
  });

  it("shows a spinner during sandbox", () => {
    render(<PlanChatPreview plan={samplePlan} runStatus="sandbox" />);
    expect(screen.getByLabelText("Updating plan")).toBeInTheDocument();
  });
});
