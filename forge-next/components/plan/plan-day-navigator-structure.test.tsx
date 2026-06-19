import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanDayNavigator } from "@/components/plan/plan-day-navigator";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const mockUseIsMobile = vi.fn(() => false);

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

function makeEditablePlan(): WorkoutPlan {
  return {
    schemaVersion: "2.0.0",
    name: "Strength Block",
    weeks: [
      {
        index: 1,
        days: [
          {
            index: 1,
            code: "w1d1",
            exercises: [
              {
                name: "Week 1 Day 1 Exercise",
                sets: [
                  {
                    id: "w1d1-1",
                    planned: {
                      type: "exact",
                      reps: 5,
                      load: { type: "absolute", value: 100, unit: "kg" },
                    },
                    actual: null,
                    status: "planned",
                    locked: false,
                  },
                ],
              },
            ],
          },
          {
            index: 2,
            code: "w1d2",
            exercises: [
              {
                name: "Week 1 Day 2 Exercise",
                sets: [
                  {
                    id: "w1d2-1",
                    planned: {
                      type: "exact",
                      reps: 3,
                      load: { type: "absolute", value: 80, unit: "kg" },
                    },
                    actual: null,
                    status: "planned",
                    locked: false,
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        index: 2,
        days: [
          {
            index: 1,
            code: "w2d1",
            exercises: [
              {
                name: "Week 2 Day 1 Exercise",
                sets: [
                  {
                    id: "w2d1-1",
                    planned: {
                      type: "exact",
                      reps: 5,
                      load: { type: "absolute", value: 60, unit: "kg" },
                    },
                    actual: null,
                    status: "planned",
                    locked: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("PlanDayNavigator structure controls", () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false);
  });

  it("shows week and day structure controls when coach editing is enabled", () => {
    render(
      <PlanDayNavigator
        plan={makeEditablePlan()}
        view="coach"
        readOnly={false}
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Add week" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Add day" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Delete week" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Delete day" }).length).toBeGreaterThan(0);
  });

  it("does not show structure controls in read-only coach view", () => {
    render(<PlanDayNavigator plan={makeEditablePlan()} view="coach" readOnly />);

    expect(screen.queryByRole("button", { name: "Add week" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add day" })).not.toBeInTheDocument();
  });

  it("confirms week deletion in a modal", async () => {
    const user = userEvent.setup();
    const onPlanChange = vi.fn();

    render(
      <PlanDayNavigator
        plan={makeEditablePlan()}
        view="coach"
        readOnly={false}
        onPlanChange={onPlanChange}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Delete week" })[0]);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText("This week and all of its days will be removed from the plan."),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Delete week" }));
    expect(onPlanChange).toHaveBeenCalled();
  });

  it("adds a week through onPlanChange", async () => {
    const user = userEvent.setup();
    const onPlanChange = vi.fn();

    render(
      <PlanDayNavigator
        plan={makeEditablePlan()}
        view="coach"
        readOnly={false}
        onPlanChange={onPlanChange}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Add week" })[0]);

    const nextPlan = onPlanChange.mock.calls.at(-1)?.[0] as WorkoutPlan;
    expect(nextPlan.weeks).toHaveLength(3);
    expect(nextPlan.weeks[2].index).toBe(3);
  });

  it("disables delete week when only one week exists", () => {
    const plan = makeEditablePlan();
    plan.weeks = [plan.weeks[0]];

    render(
      <PlanDayNavigator
        plan={plan}
        view="coach"
        readOnly={false}
        onPlanChange={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { name: "Delete week" })[0]).toBeDisabled();
  });
});
