import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PlanMobileDayPicker } from "@/components/plan/plan-mobile-day-picker";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

function makePlan(): WorkoutPlan {
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
                sets: [],
              },
            ],
          },
          {
            index: 2,
            code: "w1d2",
            exercises: [
              {
                name: "Week 1 Day 2 Exercise",
                sets: [],
              },
            ],
          },
        ],
      },
      {
        index: 2,
        label: "Deload Week",
        days: [
          {
            index: 1,
            code: "w2d1",
            exercises: [
              {
                name: "Week 2 Day 1 Exercise",
                sets: [],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("PlanMobileDayPicker", () => {
  it("renders the collapsed header with a down chevron", () => {
    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekIndex={1}
        selectedDayIndex={1}
        onSelect={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: "Day 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Day 1" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("navigates to the previous day from the header arrow", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekIndex={1}
        selectedDayIndex={2}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Previous day" }));
    expect(onSelect).toHaveBeenCalledWith({ weekIndex: 1, dayIndex: 1 });
  });

  it("navigates to the next day from the header arrow", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekIndex={1}
        selectedDayIndex={1}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next day" }));
    expect(onSelect).toHaveBeenCalledWith({ weekIndex: 1, dayIndex: 2 });
  });

  it("opens a dropdown with every week and day, then selects on tap", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekIndex={1}
        selectedDayIndex={1}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Day 1" }));

    expect(screen.getByRole("listbox", { name: "Plan days" })).toBeInTheDocument();
    const weekOne = screen.getByLabelText("Week 1");
    expect(screen.getByLabelText("Deload Week")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(within(weekOne).getByRole("option", { name: "Day 1" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.click(within(weekOne).getByRole("option", { name: "Day 2" }));

    expect(onSelect).toHaveBeenCalledWith({ weekIndex: 1, dayIndex: 2 });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("can select a day from a later week", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekIndex={1}
        selectedDayIndex={1}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Day 1" }));

    const deloadWeek = screen.getByLabelText("Deload Week");
    await user.click(within(deloadWeek).getByRole("option", { name: "Day 1" }));

    expect(onSelect).toHaveBeenCalledWith({ weekIndex: 2, dayIndex: 1 });
  });
});
