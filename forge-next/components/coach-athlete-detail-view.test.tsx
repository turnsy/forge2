import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoachAthleteDetailView } from "@/components/coach-athlete-detail-view";
import { minimalWorkoutPlan } from "@/lib/plans/__tests__/fixtures";
import type { AssignedPlan } from "@/lib/athlete/plan/repository";
import type { CoachAthleteRelationship } from "@/lib/links/types";

vi.mock("@/components/coach-athlete-plan-actions", () => ({
  CoachAthletePlanActions: () => <button type="button">Assign plan</button>,
}));

vi.mock("@/components/coach-athlete-detail-actions", () => ({
  CoachAthleteDetailActions: () => <button type="button">Unlink athlete</button>,
}));

const mockSaveAssignedPlan = vi.fn();

vi.mock("@/lib/coach/assigned-plan/use-save-assigned-plan", () => ({
  useSaveAssignedPlan: () => ({
    saveAssignedPlan: mockSaveAssignedPlan,
    saveStatus: "idle",
    saveError: null,
  }),
}));

const relationship: CoachAthleteRelationship = {
  relationshipId: "rel-1",
  status: "active",
  athleteId: "athlete-1",
  athleteName: "Alex Rivera",
  athleteEmail: "alex@example.com",
  linkedAt: "2026-01-10T00:00:00.000Z",
  currentPlanId: "plan-1",
  currentPlanName: "4-Week Strength Block",
};

function assignedPlan(overrides: Partial<AssignedPlan> = {}): AssignedPlan {
  return {
    id: "assignment-1",
    athleteId: "athlete-1",
    coachId: "coach-1",
    status: "active",
    assignedAt: "2026-01-10T00:00:00.000Z",
    completedAt: null,
    unassignedAt: null,
    planVersionId: null,
    plan: minimalWorkoutPlan,
    ...overrides,
  };
}

describe("CoachAthleteDetailView", () => {
  beforeEach(() => {
    mockSaveAssignedPlan.mockResolvedValue({});
  });

  it("renders current plan progress and viewer when an active plan exists", () => {
    render(
      <CoachAthleteDetailView
        relationship={relationship}
        activePlan={assignedPlan()}
        previousPlans={[]}
      />,
    );

    expect(screen.getByRole("tab", { name: "Current plan" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("heading", { name: "4-Week Strength Block" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "0% complete" })).toBeInTheDocument();
    expect(screen.getByText("Weeks")).toBeInTheDocument();
    expect(screen.getByText("Days/week")).toBeInTheDocument();
    expect(screen.queryByText("Progress")).not.toBeInTheDocument();
    expect(screen.getByText("Back Squat")).toBeInTheDocument();
  });

  it("shows edit controls for the active plan and enters edit mode", async () => {
    const user = userEvent.setup();

    render(
      <CoachAthleteDetailView
        relationship={relationship}
        activePlan={assignedPlan()}
        previousPlans={[]}
      />,
    );

    expect(screen.getByRole("button", { name: "Edit plan" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit plan" }));

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add exercise" }).length).toBeGreaterThan(0);
  });

  it("does not show edit controls in history detail view", async () => {
    const user = userEvent.setup();

    render(
      <CoachAthleteDetailView
        relationship={relationship}
        activePlan={assignedPlan()}
        previousPlans={[
          assignedPlan({
            id: "assignment-2",
            status: "completed",
            completedAt: "2026-02-01T12:00:00.000Z",
          }),
        ]}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "History" }));
    await user.click(screen.getAllByRole("button", { name: "4-Week Strength Block" })[0]);

    expect(screen.queryByRole("button", { name: "Edit plan" })).not.toBeInTheDocument();
  });

  it("shows empty state on current plan tab when no plan is assigned", () => {
    render(
      <CoachAthleteDetailView
        relationship={{ ...relationship, currentPlanName: null, currentPlanId: null }}
        activePlan={null}
        previousPlans={[]}
      />,
    );

    expect(screen.getByText("No plan assigned")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assign plan" })).toBeInTheDocument();
  });

  it("lists previous plans with status badges and opens detail on click", async () => {
    const user = userEvent.setup();

    render(
      <CoachAthleteDetailView
        relationship={relationship}
        activePlan={assignedPlan()}
        previousPlans={[
          assignedPlan({
            id: "assignment-2",
            status: "completed",
            completedAt: "2026-02-01T12:00:00.000Z",
          }),
          assignedPlan({
            id: "assignment-3",
            status: "unassigned",
            assignedAt: "2025-12-01T00:00:00.000Z",
            completedAt: null,
            unassignedAt: "2026-06-12T12:00:00.000Z",
          }),
        ]}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "History" }));

    expect(screen.getAllByText("Completed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Aborted").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Feb 1, 2026")).toBeInTheDocument();
    expect(screen.getByText("Jun 12, 2026")).toBeInTheDocument();
    expect(screen.queryByText("Assigned")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "4-Week Strength Block" })[0]);

    expect(screen.getByRole("button", { name: "Back to history" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "4-Week Strength Block" })).toBeInTheDocument();
    expect(screen.queryByText("← Back to previous plans")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "0% complete" })).toBeInTheDocument();
  });

  it("shows athlete info and unlink action on the profile tab", async () => {
    const user = userEvent.setup();

    render(
      <CoachAthleteDetailView
        relationship={relationship}
        activePlan={assignedPlan()}
        previousPlans={[]}
      />,
    );

    await user.click(screen.getByRole("tab", { name: "Profile" }));

    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unlink athlete" })).toBeInTheDocument();
  });
});
