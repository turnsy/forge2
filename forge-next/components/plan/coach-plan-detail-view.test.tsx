import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CoachPlanDetailView } from "@/components/plan/coach-plan-detail-view";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";

describe("CoachPlanDetailView", () => {
  it("shows plan by default and toggles version history", async () => {
    const user = userEvent.setup();

    render(
      <CoachPlanDetailView
        planId="plan-1"
        plan={minimalWorkoutPlan}
        createdAt="2026-01-01T00:00:00.000Z"
        versions={[
          {
            id: "version-1",
            changeSummary: null,
            createdAt: "2026-01-01T00:00:00.000Z",
            createdBy: "coach-1",
            isActive: true,
          },
        ]}
      />,
    );

    expect(screen.getByText("4-Week Strength Block")).toBeInTheDocument();
    expect(screen.queryByText("Version history")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByText("Version history")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.queryByText("Version history")).not.toBeInTheDocument();
  });
});
