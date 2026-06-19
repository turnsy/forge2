import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AthletePlanHistoryView } from "@/components/athlete-plan-history-view";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import type { AssignedPlan } from "@/lib/athlete/plan/repository";

vi.mock("@/components/plan/plan-day-navigator", () => ({
  PlanDayNavigator: ({
    assignmentId,
    readOnly,
  }: {
    assignmentId?: string;
    readOnly?: boolean;
  }) => (
    <div data-testid="plan-day-navigator">
      {readOnly ? "read-only" : "editable"}:{assignmentId}
    </div>
  ),
}));

function assignedPlan(overrides: Partial<AssignedPlan> = {}): AssignedPlan {
  return {
    id: "assignment-1",
    athleteId: "athlete-1",
    coachId: "coach-1",
    status: "completed",
    assignedAt: "2026-01-10T00:00:00.000Z",
    completedAt: "2026-02-01T00:00:00.000Z",
    unassignedAt: null,
    planVersionId: null,
    plan: minimalWorkoutPlan,
    ...overrides,
  };
}

describe("AthletePlanHistoryView", () => {
  it("shows empty state when there are no plans", () => {
    render(<AthletePlanHistoryView plans={[]} />);

    expect(screen.getByText("No previous plans")).toBeInTheDocument();
  });

  it("lists previous plans with status badges and opens athlete read-only detail", async () => {
    const user = userEvent.setup();

    render(
      <AthletePlanHistoryView
        plans={[
          assignedPlan({
            id: "assignment-2",
            status: "completed",
            completedAt: "2026-02-01T00:00:00.000Z",
          }),
          assignedPlan({
            id: "assignment-3",
            status: "unassigned",
            completedAt: null,
            unassignedAt: "2026-06-12T00:00:00.000Z",
          }),
        ]}
      />,
    );

    expect(screen.getAllByText("Completed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Aborted").length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getAllByRole("button", { name: "4-Week Strength Block" })[0]);

    expect(screen.getByRole("button", { name: "Back to history" })).toBeInTheDocument();
    expect(screen.getByTestId("plan-day-navigator")).toHaveTextContent(
      "read-only:assignment-2",
    );
  });

  it("returns to the list from plan detail", async () => {
    const user = userEvent.setup();

    render(
      <AthletePlanHistoryView
        plans={[
          assignedPlan({
            id: "assignment-2",
            status: "completed",
          }),
        ]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "4-Week Strength Block" }));
    await user.click(screen.getByRole("button", { name: "Back to history" }));

    expect(screen.getByRole("button", { name: "4-Week Strength Block" })).toBeInTheDocument();
    expect(screen.queryByTestId("plan-day-navigator")).not.toBeInTheDocument();
  });
});
