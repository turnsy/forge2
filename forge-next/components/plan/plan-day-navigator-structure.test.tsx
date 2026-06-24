import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeBlock, makeDay, makeExercise, makeSet } from "@/lib/plans/__tests__/fixtures";
import { PlanDayNavigator } from "@/components/plan/plan-day-navigator";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const mockUseIsMobile = vi.fn(() => false);

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

function makeEditablePlan(): WorkoutPlan {
  return {
    schemaVersion: "3.0.0",
    name: "Strength Block",
    weeks: [
      {
        days: [
          makeDay({
            code: "w1d1",
            blocks: [
              makeBlock({
                id: "w1d1-b1",
                exercises: [
                  makeExercise({
                    id: "w1d1-ex1",
                    name: "Week 1 Day 1 Exercise",
                    sets: [
                      makeSet({
                        id: "w1d1-1",
                        planned: {
                          type: "exact",
                          reps: 5,
                          target: { type: "absolute", value: 100, unit: "kg" },
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          makeDay({
            code: "w1d2",
            blocks: [
              makeBlock({
                id: "w1d2-b1",
                exercises: [
                  makeExercise({
                    id: "w1d2-ex1",
                    name: "Week 1 Day 2 Exercise",
                    sets: [
                      makeSet({
                        id: "w1d2-1",
                        planned: {
                          type: "exact",
                          reps: 3,
                          target: { type: "absolute", value: 80, unit: "kg" },
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
      {
        days: [
          makeDay({
            code: "w2d1",
            blocks: [
              makeBlock({
                id: "w2d1-b1",
                exercises: [
                  makeExercise({
                    id: "w2d1-ex1",
                    name: "Week 2 Day 1 Exercise",
                    sets: [
                      makeSet({
                        id: "w2d1-1",
                        planned: {
                          type: "exact",
                          reps: 5,
                          target: { type: "absolute", value: 60, unit: "kg" },
                        },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
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
    expect(nextPlan.weeks[2].days).toHaveLength(1);
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
