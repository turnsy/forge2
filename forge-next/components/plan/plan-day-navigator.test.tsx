import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeBlock, makeDay, makeExercise, makeSet } from "@/lib/plans/__tests__/fixtures";
import { PlanDayNavigator } from "@/components/plan/plan-day-navigator";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

const mockUseIsMobile = vi.fn(() => false);

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}));

function makeMultiWeekPlan(): WorkoutPlan {
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
                          load: { type: "absolute", value: 100, unit: "kg" },
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
                          load: { type: "absolute", value: 80, unit: "kg" },
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
        label: "Deload Week",
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
                          load: { type: "absolute", value: 60, unit: "kg" },
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

function makeSingleDayPlan(): WorkoutPlan {
  return {
    schemaVersion: "3.0.0",
    name: "Single Day",
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
                    name: "Only Exercise",
                    sets: [
                      makeSet({
                        id: "w1d1-1",
                        planned: {
                          type: "exact",
                          reps: 5,
                          load: { type: "absolute", value: 100, unit: "kg" },
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

describe("PlanDayNavigator", () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false);
  });

  it("renders week and day dropdowns on desktop viewport", () => {
    render(<PlanDayNavigator plan={makeMultiWeekPlan()} view="coach" readOnly />);

    expect(screen.getByLabelText("Week")).toBeInTheDocument();
    expect(screen.getByLabelText("Day")).toBeInTheDocument();
    expect(screen.getByText("Week 1 Day 1 Exercise")).toBeInTheDocument();
  });

  it("renders the mobile day picker header on mobile viewport", () => {
    mockUseIsMobile.mockReturnValue(true);

    render(<PlanDayNavigator plan={makeMultiWeekPlan()} view="coach" readOnly />);

    expect(screen.getByRole("button", { name: "Week 1, Day 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous day" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next day" })).toBeInTheDocument();
  });

  it("navigates days from the mobile header arrows", async () => {
    mockUseIsMobile.mockReturnValue(true);
    const user = userEvent.setup();

    render(<PlanDayNavigator plan={makeMultiWeekPlan()} view="coach" readOnly />);

    await user.click(screen.getByRole("button", { name: "Next day" }));
    expect(screen.getByText("Week 1 Day 2 Exercise")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Week 1, Day 2" })).toBeInTheDocument();
  });

  it("changing week resets day to Day 1", async () => {
    const user = userEvent.setup();
    render(<PlanDayNavigator plan={makeMultiWeekPlan()} view="coach" readOnly />);

    await user.selectOptions(screen.getByLabelText("Day"), "1");
    expect(screen.getByText("Week 1 Day 2 Exercise")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Week"), "1");
    expect(screen.getByLabelText("Day")).toHaveValue("0");
    expect(screen.getByText("Week 2 Day 1 Exercise")).toBeInTheDocument();
  });

  it("shows correct week labels with named weeks and fallbacks", () => {
    render(<PlanDayNavigator plan={makeMultiWeekPlan()} view="coach" readOnly />);

    expect(screen.getByLabelText("Week")).toHaveTextContent("Week 1");
    expect(screen.getByLabelText("Week")).toHaveTextContent("Deload Week");
  });

  it("shows correct day labels", () => {
    render(<PlanDayNavigator plan={makeMultiWeekPlan()} view="coach" readOnly />);

    expect(screen.getByLabelText("Day")).toHaveTextContent("Day 1");
    expect(screen.getByLabelText("Day")).toHaveTextContent("Day 2");
  });

  it("renders nav with one item each for a single week and day", () => {
    render(<PlanDayNavigator plan={makeSingleDayPlan()} view="coach" readOnly />);

    expect(screen.getByLabelText("Week")).toBeInTheDocument();
    expect(screen.getByLabelText("Day")).toBeInTheDocument();
    expect(screen.getByText("Only Exercise")).toBeInTheDocument();
  });

  it("defaults to first incomplete day for athlete view", () => {
    const plan = makeMultiWeekPlan();
    plan.weeks[0].days[0].blocks[0].exercises[0].sets[0].status = "completed";

    render(<PlanDayNavigator plan={plan} view="athlete" assignmentId="assignment-1" />);

    expect(screen.getByText("Week 1 Day 2 Exercise")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: plan.name })).toBeInTheDocument();
  });

  it("hides the athlete title header in read-only history view", () => {
    const plan = makeMultiWeekPlan();

    render(
      <PlanDayNavigator
        plan={plan}
        view="athlete"
        readOnly
        assignmentId="assignment-1"
      />,
    );

    expect(screen.queryByRole("heading", { name: plan.name })).not.toBeInTheDocument();
  });

  it("defaults to Day 1 of Week 1 for coach view", () => {
    render(<PlanDayNavigator plan={makeMultiWeekPlan()} view="coach" readOnly />);

    expect(screen.getByText("Week 1 Day 1 Exercise")).toBeInTheDocument();
  });

  it("updates day content when nav selection changes", async () => {
    const user = userEvent.setup();
    render(<PlanDayNavigator plan={makeMultiWeekPlan()} view="coach" readOnly />);

    expect(screen.getByText("Week 1 Day 1 Exercise")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Day"), "1");
    expect(screen.getByText("Week 1 Day 2 Exercise")).toBeInTheDocument();
    expect(screen.queryByText("Week 1 Day 1 Exercise")).not.toBeInTheDocument();
  });

  it("handles out-of-bounds week/day gracefully", () => {
    render(
      <PlanDayNavigator
        plan={makeSingleDayPlan()}
        view="coach"
        readOnly
        initialDay={{ weekPos: 99, dayPos: 99 }}
      />,
    );

    expect(screen.getByText("Only Exercise")).toBeInTheDocument();
  });
});
