import { fireEvent, render, screen, within } from "@testing-library/react";
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

    expect(screen.getByRole("button", { name: "Week 1, Day 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Week 1, Day 1" })).toHaveAttribute(
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

  it("opens a dropdown of the current week's days and selects on tap", async () => {
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

    await user.click(screen.getByRole("button", { name: "Week 1, Day 1" }));

    expect(screen.getByRole("listbox", { name: "Week 1 days" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Day 1" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    await user.click(screen.getByRole("option", { name: "Day 2" }));

    expect(onSelect).toHaveBeenCalledWith({ weekIndex: 1, dayIndex: 2 });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("swipes between weeks in the dropdown", async () => {
    const user = userEvent.setup();

    render(
      <PlanMobileDayPicker
        plan={makePlan()}
        selectedWeekIndex={1}
        selectedDayIndex={2}
        onSelect={() => undefined}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Week 1, Day 2" }));

    const dropdown = screen.getByRole("listbox", { name: "Week 1 days" });
    const weekLabel = within(dropdown).getByText("Week 1");

    fireEvent.touchStart(weekLabel, {
      touches: [{ clientX: 180 }],
    });
    fireEvent.touchEnd(weekLabel, {
      changedTouches: [{ clientX: 100 }],
    });

    expect(screen.getByRole("listbox", { name: "Deload Week days" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Day 1" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});
